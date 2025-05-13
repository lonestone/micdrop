import {
  CallClientCommands,
  CallServerCommands,
  Conversation,
  ConversationMessage,
  VAD,
} from '@micdrop/client'
import EventEmitter from 'eventemitter3'
import { MicRecorder } from '../audio/MicRecorder'
import { mic } from '../audio/mic'
import { speaker } from '../audio/speaker'
import { getVAD, VADConfig } from '../audio/vad/getVAD'
import { CallClientError, CallClientErrorCode } from './CallClientError'

export interface CallClientEvents {
  EndCall: []
  Error: [CallClientError]
  StateChange: void
}

export interface CallClientOptions {
  vad?: VADConfig
  disableInterruption?: boolean
}

declare global {
  interface Window {
    micdropCallClient: any
  }
}

export class CallClient<
  Params extends {},
  Options extends CallClientOptions = CallClientOptions,
> extends EventEmitter<CallClientEvents> {
  public static getInstance<
    P extends {},
    O extends CallClientOptions = CallClientOptions,
  >(options?: O): CallClient<P, O> {
    if (!window.micdropCallClient) {
      window.micdropCallClient = new CallClient<P, O>(options)
    }
    return window.micdropCallClient
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
  private _isProcessing = false
  private _isPaused = false

  private constructor(private options?: Options) {
    super()

    // Init VAD
    this.vad = getVAD(this.options?.vad)

    // Add speaker listener
    this.onSpeakerStartPlaying = this.onSpeakerStartPlaying.bind(this)
    this.onSpeakerStopPlaying = this.onSpeakerStopPlaying.bind(this)
    speaker.on('StartPlaying', this.onSpeakerStartPlaying)
    speaker.on('StopPlaying', this.onSpeakerStopPlaying)
  }

  get isStarted(): boolean {
    return (this.isWSStarted && this.micRecorder?.state.isStarted) || false
  }

  get isStarting(): boolean {
    return this.isWSStarting || this.micRecorder?.state.isStarting || false
  }

  get isPaused(): boolean {
    return this._isPaused
  }

  get isProcessing(): boolean {
    return this._isProcessing && !this.isPaused
  }

  get isListening(): boolean {
    return (
      this.isMicStarted &&
      !this.isPaused &&
      !this.isProcessing &&
      !this.isMicMuted &&
      !this.isUserSpeaking &&
      !this.isAssistantSpeaking
    )
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

  get isUserSpeaking(): boolean {
    return this.micRecorder?.state.isSpeaking ?? false
  }

  get isAssistantSpeaking(): boolean {
    return speaker.isPlaying
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
      console.error('[CallClient] stop WS', error)
    }

    try {
      // Stop microphone
      this.micRecorder?.stop()
      this.stopMic()
    } catch (error) {
      console.error('[CallClient] stop mic', error)
    }
  }

  pause() {
    if (this.isPaused) return
    this.micRecorder?.mute()
    this._isPaused = true
    this._isProcessing = false
    this.notifyStateChange()
    speaker.pauseAudio()
    this.ws?.send(CallClientCommands.Mute)
  }

  resume() {
    if (!this.isPaused) return
    this.micRecorder?.unmute()
    this._isPaused = false
    this.notifyStateChange()
  }

  async destroy() {
    this.stop()
    speaker.off('StartPlaying', this.onSpeakerStartPlaying)
    speaker.off('StopPlaying', this.onSpeakerStopPlaying)
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
          this.log(`[Mic] Chunk`, blob)
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
          if (this.isWSStarted) {
            this._isProcessing = true
          }
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
      console.error('[CallClient] startMic', error)
      this.emit('Error', new CallClientError(CallClientErrorCode.Mic))
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
      throw new Error('[CallClient] startWS: WebSocket is already started')
    }
    if (!this.isMicStarted) {
      throw new Error('[CallClient] startWS: Microphone is not started')
    }
    if (!this.url) {
      throw new Error('[CallClient] startWS: URL is not set')
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
        this.emit('Error', new CallClientError())
      } else if (event.code === 4401) {
        // Unauthorized
        this.emit(
          'Error',
          new CallClientError(CallClientErrorCode.Unauthorized)
        )
      } else if (event.code >= 4000) {
        // Custom error
        this.emit('Error', new CallClientError())
      }
    }
    this.ws.onerror = (event) => {
      console.error('[CallClient] [WS] Error:', event)
      this.stop()
    }
  }

  private stopWS() {
    if (!this.ws) return
    this.ws.close()
    this.ws = undefined
    this.notifyStateChange()
  }

  private onSpeakerStartPlaying() {
    this.log('[Speaker] Start speaking')
    if (this.options?.disableInterruption && !this.isPaused) {
      this.micRecorder?.mute()
    }
    this.notifyStateChange()
  }

  private onSpeakerStopPlaying() {
    this.log('[Speaker] Stop speaking')
    if (this.options?.disableInterruption && !this.isPaused) {
      this.micRecorder?.unmute()
    }
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
