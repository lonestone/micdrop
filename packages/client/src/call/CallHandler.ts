import {
  CallClientCommands,
  CallServerCommands,
  Conversation,
} from '@micdrop/server'
import EventEmitter from 'eventemitter3'
import { MicRecorder } from '../audio/MicRecorder'
import { startMicrophone, stopMicrophone } from '../audio/microphone'
import { playAudioBlob, stopAudioBlob } from '../audio/speaker'
import { CallHandlerError, CallHandlerErrorCode } from './CallHandlerError'

const debugEnabled = false

export interface CallHandlerEvents {
  EndInterview: []
  Error: [CallHandlerError]
  StateChange: void
}

export class CallHandler<
  Params extends {},
> extends EventEmitter<CallHandlerEvents> {
  public url?: string
  public params?: Params
  public micRecorder = new MicRecorder()
  public conversation: Conversation = []

  private ws?: WebSocket
  private micStream?: MediaStream
  private startTime = 0
  private lastAudioBlob?: Blob

  constructor() {
    super()

    // Notify mic recorder state change
    this.micRecorder.on('StateChange', () => {
      this.notifyStateChange()
    })

    // Send chunk of user speech to server
    this.micRecorder.on('Chunk', (blob) => {
      this.debug(`[Mic] onChunk`, blob)
      this.ws?.send(blob)
    })

    // Notify server that user started speaking
    this.micRecorder.on('StartSpeaking', () => {
      this.debug('[Mic] onStartSpeaking')
      this.ws?.send(CallClientCommands.StartSpeaking)
      // Interruption / Stop assistant speech if playing
      stopAudioBlob()
    })

    // Notify server that user speech is complete
    this.micRecorder.on('StopSpeaking', () => {
      this.debug('[Mic] onSilence')
      this.ws?.send(CallClientCommands.StopSpeaking)
    })
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

  async start() {
    // Reset state
    this.startTime = Date.now()
    this.conversation = []

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
  }

  resume() {
    if (this.lastAudioBlob) {
      playAudioBlob(this.lastAudioBlob)
    }
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
      this.debug('[WS] Opened')
      this.notifyStateChange()

      // Send params
      if (this.params) {
        this.ws?.send(JSON.stringify(this.params))
      }
    }
    this.ws.onmessage = (event) => {
      this.debug('[WS]', event.data)
      if (event.data instanceof Blob) {
        // Received assistant speech
        playAudioBlob(event.data)
        this.lastAudioBlob = event.data
      } else if (typeof event.data !== 'string') {
        console.warn(`[WS] Unknown message type: ${event.data}`)
      } else if (event.data.startsWith(CallServerCommands.UserMessage)) {
        // Received user speech transcript
        this.addMessage(
          'user',
          event.data.substring(CallServerCommands.UserMessage.length + 1)
        )
      } else if (event.data.startsWith(CallServerCommands.AssistantMessage)) {
        // Received assistant answer
        this.addMessage(
          'assistant',
          event.data.substring(CallServerCommands.AssistantMessage.length + 1)
        )
      } else if (event.data === CallServerCommands.EndInterview) {
        // Interview ended
        setTimeout(() => {
          this.emit('EndInterview')
        }, 2000) // Wait to prevent conflict
      } else if (event.data === CallServerCommands.CancelLastAssistantMessage) {
        // Remove last assistant message if aborted
        this.conversation = this.conversation.slice(0, -1)
        this.notifyStateChange()
      }
    }
    this.ws.onclose = (event) => {
      this.debug('[WS] Closed', event)
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

  private addMessage(role: 'user' | 'assistant', message: string) {
    this.conversation.push({ role, content: message })
    this.notifyStateChange()
  }

  private notifyStateChange() {
    this.emit('StateChange')
  }

  private debug(...message: any[]) {
    if (!debugEnabled) return
    console.log(`[Debug ${Date.now() - this.startTime}]`, ...message)
  }
}
