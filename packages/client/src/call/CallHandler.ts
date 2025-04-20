import EventEmitter from 'eventemitter3'
import {
  CallClientCommands,
  CallServerCommands,
  Conversation,
  ConversationMessage,
} from '../..'
import { MicRecorder } from '../audio/MicRecorder'
import { startMicrophone, stopMicrophone } from '../audio/microphone'
import {
  enableStreaming,
  pauseAudio,
  playAudio,
  resumeAudio,
  stopAudio,
} from '../audio/speaker'
import { SileroVAD } from '../audio/vad/SileroVAD'
import { VAD } from '../audio/vad/VAD'
import { VolumeVAD } from '../audio/vad/VolumeVAD'
import { CallHandlerError, CallHandlerErrorCode } from './CallHandlerError'

export interface CallHandlerEvents {
  EndInterview: []
  Error: [CallHandlerError]
  StateChange: void
}

export interface CallHandlerOptions {
  vad?: VAD | 'volume' | 'silero'
}

export class CallHandler<
  Params extends {},
  Options extends CallHandlerOptions = CallHandlerOptions,
> extends EventEmitter<CallHandlerEvents> {
  private static instance: CallHandler<any>

  public static getInstance<
    T extends {},
    Options extends CallHandlerOptions = CallHandlerOptions,
  >(options?: Options): CallHandler<T, Options> {
    if (!CallHandler.instance) {
      CallHandler.instance = new CallHandler<T, Options>(options)
    }
    return CallHandler.instance
  }

  public url?: string
  public params?: Params
  public micRecorder: MicRecorder
  public conversation: Conversation = []
  public debug = false

  private ws?: WebSocket
  private micStream?: MediaStream
  private startTime = 0
  private lastAudioBlob?: Blob
  private _isProcessing = false

  private constructor(options?: Options) {
    super()

    this.micRecorder = new MicRecorder(this.getVAD(options?.vad))

    // Notify mic recorder state change
    this.micRecorder.on('StateChange', () => {
      this.notifyStateChange()
    })

    // Send chunk of user speech to server
    this.micRecorder.on('Chunk', (blob) => {
      this.log(`[Mic] Received chunk`, blob)
      this.ws?.send(blob)
    })

    // Notify server that user started speaking
    this.micRecorder.on('StartSpeaking', () => {
      this.log('[Mic] Start speaking')
      this.ws?.send(CallClientCommands.StartSpeaking)
      // Interruption
      this._isProcessing = false
      this.notifyStateChange()
      stopAudio()
    })

    // Notify server that user speech is complete
    this.micRecorder.on('StopSpeaking', () => {
      this.log('[Mic] Stop speaking')
      this.ws?.send(CallClientCommands.StopSpeaking)
      this._isProcessing = true
      this.notifyStateChange()
    })
  }

  private getVAD(vad?: VAD | 'volume' | 'silero'): VAD {
    if (!vad) return new VolumeVAD()
    if (vad === 'volume') return new VolumeVAD()
    if (vad === 'silero') return new SileroVAD()
    return vad
  }

  get isStarted() {
    return this.isWSStarted && this.micRecorder.state.isStarted
  }

  get isStarting() {
    return this.isWSStarting || this.micRecorder.state.isStarting
  }

  get isWSStarted() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  get isWSStarting() {
    return this.ws?.readyState === WebSocket.CONNECTING
  }

  get isMicStarted() {
    return !!this.micStream
  }

  get isProcessing() {
    return this._isProcessing
  }

  async start() {
    // Reset state
    this.startTime = Date.now()
    this.conversation = []
    this._isProcessing = true

    // Start mic if not already started
    await this.startMic(undefined, true)

    // Start websocket
    await this.startWS()
  }

  async stop() {
    try {
      // Stop websocket
      this.stopWS()
    } catch (error) {
      console.error('[CallHandler] stop WS', error)
    }

    try {
      // Stop microphone
      this.micRecorder.stop()
      this.stopMic()
    } catch (error) {
      console.error('[CallHandler] stop mic', error)
    }
  }

  pause() {
    this.micRecorder.mute()
    this.notifyStateChange()
    pauseAudio()
  }

  resume() {
    if (this.lastAudioBlob) {
      playAudio(this.lastAudioBlob)
    }
    resumeAudio()
    this.micRecorder.unmute()
    this.notifyStateChange()
  }

  async startMic(deviceId?: string, record = true) {
    try {
      // Stop recorder if it was running
      const isRecorderStarted = this.micRecorder.state.isStarted
      if (isRecorderStarted) {
        this.micRecorder.stop()
      }

      // Start microphone
      this.micStream = await startMicrophone(deviceId)
      this.notifyStateChange()

      // Restart recorder if it was running
      if (isRecorderStarted || record) {
        await this.micRecorder.start(this.micStream)
      }
    } catch (error) {
      console.error('[CallHandler] startMic', error)
      this.emit('Error', new CallHandlerError(CallHandlerErrorCode.Mic))
      this.stop()
    }
  }

  private stopMic() {
    stopMicrophone()
    this.micStream = undefined
    this.notifyStateChange()
  }

  private async startWS() {
    if (this.ws) {
      throw new Error('[CallHandler] startWS: WebSocket is already started')
    }
    if (!this.isMicStarted) {
      throw new Error('[CallHandler] startWS: Microphone is not started')
    }
    if (!this.url) {
      throw new Error('[CallHandler] startWS: URL is not set')
    }

    // Start websocket
    this.ws = new WebSocket(this.url)
    this.ws.binaryType = 'blob'
    this.notifyStateChange()

    // Events
    this.ws.onopen = () => {
      this.log('[WS] Opened')
      this.notifyStateChange()

      // Send params
      if (this.params) {
        this.ws?.send(JSON.stringify(this.params))
      }
    }
    this.ws.onmessage = (event) => {
      this.log('[WS]', event.data)
      if (event.data instanceof Blob) {
        // Received assistant speech
        playAudio(event.data)
        this.lastAudioBlob = event.data
        this._isProcessing = false
        this.notifyStateChange()
      } else if (typeof event.data !== 'string') {
        console.warn(`[WS] Unknown message type: ${event.data}`)
      } else if (event.data.startsWith(CallServerCommands.Message)) {
        // Received user/assistant message
        const message = JSON.parse(
          event.data.substring(CallServerCommands.Message.length + 1)
        )
        this.addMessage(message)
      } else if (event.data === CallServerCommands.EndInterview) {
        // Interview ended
        setTimeout(() => {
          this.emit('EndInterview')
        }, 2000) // Wait to prevent conflict
      } else if (event.data === CallServerCommands.CancelLastAssistantMessage) {
        // Remove last assistant message if aborted
        const lastMessage = this.conversation[this.conversation.length - 1]
        if (lastMessage?.role === 'assistant') {
          this.conversation = this.conversation.slice(0, -1)
          this.notifyStateChange()
        }
      } else if (event.data === CallServerCommands.EnableSpeakerStreaming) {
        // Enable speaker streaming
        enableStreaming()
      }
    }
    this.ws.onclose = (event) => {
      this.log('[WS] Closed', event)
      this.notifyStateChange()

      if (event.code >= 1001 && event.code <= 1011 && event.code !== 1005) {
        // Internal server error
        this.emit('Error', new CallHandlerError())
      } else if (event.code === 4401) {
        // Unauthorized
        this.emit(
          'Error',
          new CallHandlerError(CallHandlerErrorCode.Unauthorized)
        )
      } else if (event.code >= 4000) {
        // Custom error
        this.emit('Error', new CallHandlerError())
      }
    }
    this.ws.onerror = (event) => {
      console.error('[CallHandler] [WS] Error:', event)
      this.stop()
    }
  }

  private stopWS() {
    if (!this.ws) return
    this.ws.close()
    this.ws = undefined
    this.notifyStateChange()
  }

  private addMessage(message: ConversationMessage) {
    this.conversation.push(message)
    this.notifyStateChange()
  }

  private notifyStateChange() {
    this.emit('StateChange')
  }

  private log(...message: any[]) {
    if (!this.debug) return
    console.log(`[Debug ${Date.now() - this.startTime}]`, ...message)
  }
}
