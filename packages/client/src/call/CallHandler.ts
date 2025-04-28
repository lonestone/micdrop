import EventEmitter from 'eventemitter3'
import {
  CallClientCommands,
  CallServerCommands,
  Conversation,
  ConversationMessage,
  VAD,
} from '../..'
import { MicRecorder } from '../audio/MicRecorder'
import { mic } from '../audio/mic'
import { speaker } from '../audio/speaker'
import { getVAD, VADConfig } from '../audio/vad/getVAD'
import { CallHandlerError, CallHandlerErrorCode } from './CallHandlerError'

export interface CallHandlerEvents {
  EndCall: []
  Error: [CallHandlerError]
  StateChange: void
}

export interface CallHandlerOptions {
  vad?: VADConfig
}

declare global {
  interface Window {
    micdropCallHandler: any
  }
}

export class CallHandler<
  Params extends {},
  Options extends CallHandlerOptions = CallHandlerOptions,
> extends EventEmitter<CallHandlerEvents> {
  public static getInstance<
    P extends {},
    O extends CallHandlerOptions = CallHandlerOptions,
  >(options?: O): CallHandler<P, O> {
    if (!window.micdropCallHandler) {
      window.micdropCallHandler = new CallHandler<P, O>(options)
    }
    return window.micdropCallHandler
  }

  public url?: string
  public params?: Params
  public micRecorder?: MicRecorder
  public vad: VAD
  public conversation: Conversation = []
  public debug = false

  private ws?: WebSocket
  private micStream?: MediaStream
  private startTime = 0
  private lastAudioBlob?: Blob
  private _isProcessing = false

  private constructor(private options?: Options) {
    super()

    // Init VAD
    this.vad = getVAD(this.options?.vad)
  }

  get isStarted(): boolean {
    return (this.isWSStarted && this.micRecorder?.state.isStarted) || false
  }

  get isStarting(): boolean {
    return this.isWSStarting || this.micRecorder?.state.isStarting || false
  }

  get isWSStarted(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  get isWSStarting(): boolean {
    return this.ws?.readyState === WebSocket.CONNECTING
  }

  get isMicStarted(): boolean {
    return !!this.micStream
  }

  get isMicMuted(): boolean {
    return this.micRecorder?.state.isMuted ?? false
  }

  get isMicSpeaking(): boolean {
    return this.micRecorder?.state.isSpeaking ?? false
  }

  get isProcessing(): boolean {
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
      this.micRecorder?.stop()
      this.stopMic()
    } catch (error) {
      console.error('[CallHandler] stop mic', error)
    }
  }

  pause() {
    this.micRecorder?.mute()
    this._isProcessing = false
    this.notifyStateChange()
    speaker.pauseAudio()
    this.ws?.send(CallClientCommands.Mute)
  }

  resume() {
    if (this.lastAudioBlob) {
      speaker.playAudio(this.lastAudioBlob)
    }
    speaker.resumeAudio()
    this.micRecorder?.unmute()
    this.notifyStateChange()
  }

  async startMic(deviceId?: string, record = true) {
    try {
      if (!this.micRecorder) {
        this.micRecorder = new MicRecorder(this.vad)

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
          speaker.stopAudio()
        })

        // Notify server that user speech is complete
        this.micRecorder.on('StopSpeaking', () => {
          this.log('[Mic] Stop speaking')
          this.ws?.send(CallClientCommands.StopSpeaking)
          this._isProcessing = true
          this.notifyStateChange()
        })
      }

      // Stop recorder if it was running
      const isRecorderStarted = this.micRecorder.state.isStarted
      if (isRecorderStarted) {
        this.micRecorder?.stop()
      }

      // Start microphone
      this.micStream = await mic.start(deviceId)
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
    this.micRecorder?.stop()
    this.micRecorder = undefined
    mic.stop()
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
        speaker.playAudio(event.data)
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
      } else if (event.data === CallServerCommands.EndCall) {
        // Call ended
        setTimeout(() => {
          this.emit('EndCall')
        }, 2000) // Wait to prevent conflict
      } else if (event.data === CallServerCommands.CancelLastAssistantMessage) {
        // Remove last assistant message if aborted
        const lastMessage = this.conversation[this.conversation.length - 1]
        if (lastMessage?.role === 'assistant') {
          this.conversation = this.conversation.slice(0, -1)
          this.notifyStateChange()
        }
      } else if (event.data === CallServerCommands.SkipAnswer) {
        // Answer was skipped, listen again
        this._isProcessing = false
        this.notifyStateChange()
      } else if (event.data === CallServerCommands.CancelLastUserMessage) {
        // Remove last user message if aborted
        const lastMessage = this.conversation[this.conversation.length - 1]
        if (lastMessage?.role === 'user') {
          this.conversation = this.conversation.slice(0, -1)
          this._isProcessing = false
          this.notifyStateChange()
        }
      } else if (event.data === CallServerCommands.EnableSpeakerStreaming) {
        // Enable speaker streaming
        speaker.enableStreaming()
      }
    }
    this.ws.onclose = (event) => {
      this.log('[WS] Closed', event)
      this.stop()

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
