import {
  getClientErrorFromWSCloseEvent,
  MicdropClientCommands,
  MicdropConversation,
  MicdropConversationMessage,
  MicdropServerCommands,
  VAD,
} from '@micdrop/client'
import EventEmitter from 'eventemitter3'
import { MicRecorder } from '../audio/MicRecorder'
import { mic } from '../audio/mic'
import { speaker } from '../audio/speaker'
import { getVAD, VADConfig } from '../audio/vad/getVAD'
import {
  MicdropClientError,
  MicdropClientErrorCode,
} from './MicdropClientError'

export interface MicdropClientEvents {
  EndCall: []
  Error: [MicdropClientError]
  StateChange: void
}

export interface MicdropClientOptions {
  vad?: VADConfig
  disableInterruption?: boolean
}

declare global {
  interface Window {
    micdropMicdropClient: any
  }
}

export class MicdropClient<
  Params extends {},
  Options extends MicdropClientOptions = MicdropClientOptions,
> extends EventEmitter<MicdropClientEvents> {
  public static getInstance<
    P extends {},
    O extends MicdropClientOptions = MicdropClientOptions,
  >(options?: O): MicdropClient<P, O> {
    if (!window.micdropMicdropClient) {
      window.micdropMicdropClient = new MicdropClient<P, O>(options)
    }
    return window.micdropMicdropClient
  }

  public url?: string
  public params?: Params
  public micRecorder?: MicRecorder
  public vad: VAD
  public conversation: MicdropConversation = []
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
    this._isPaused = false

    // Start mic if not already started
    await this.startMic(undefined, true)

    // Start websocket
    await this.startWS()
  }

  async stop() {
    this._isProcessing = false
    this._isPaused = false
    try {
      // Stop websocket
      this.stopWS()
    } catch (error) {
      console.error('[MicdropClient] stop WS', error)
    }

    try {
      // Stop microphone
      this.micRecorder?.stop()
      this.stopMic()
    } catch (error) {
      console.error('[MicdropClient] stop mic', error)
    }
  }

  pause() {
    if (this.isPaused) return
    this.micRecorder?.mute()
    this._isPaused = true
    this._isProcessing = false
    this.notifyStateChange()
    speaker.pauseAudio()
    this.ws?.send(MicdropClientCommands.Mute)
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
          this.ws?.send(MicdropClientCommands.StartSpeaking)
          // Interruption
          this._isProcessing = false
          this.notifyStateChange()
          speaker.stopAudio()
        })

        // Notify server that user speech is complete
        this.micRecorder.on('StopSpeaking', () => {
          this.log('[Mic] Stop speaking')
          this.ws?.send(MicdropClientCommands.StopSpeaking)
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
      console.error('[MicdropClient] startMic', error)
      this.emit('Error', new MicdropClientError(MicdropClientErrorCode.Mic))
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
      throw new Error('[MicdropClient] startWS: WebSocket is already started')
    }
    if (!this.isMicStarted) {
      throw new Error('[MicdropClient] startWS: Microphone is not started')
    }
    if (!this.url) {
      throw new Error('[MicdropClient] startWS: URL is not set')
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
      } else if (event.data.startsWith(MicdropServerCommands.Message)) {
        // Received user/assistant message
        const message = JSON.parse(
          event.data.substring(MicdropServerCommands.Message.length + 1)
        )
        this.addMessage(message)
      } else if (event.data === MicdropServerCommands.EndCall) {
        // Call ended
        setTimeout(() => {
          this.emit('EndCall')
        }, 2000) // Wait to prevent conflict
      } else if (
        event.data === MicdropServerCommands.CancelLastAssistantMessage
      ) {
        // Remove last assistant message if aborted
        const lastMessage = this.conversation[this.conversation.length - 1]
        if (lastMessage?.role === 'assistant') {
          this.conversation = this.conversation.slice(0, -1)
          this.notifyStateChange()
        }
      } else if (event.data === MicdropServerCommands.SkipAnswer) {
        // Answer was skipped, listen again
        this._isProcessing = false
        this.notifyStateChange()
      } else if (event.data === MicdropServerCommands.CancelLastUserMessage) {
        // Remove last user message if aborted
        const lastMessage = this.conversation[this.conversation.length - 1]
        if (lastMessage?.role === 'user') {
          this.conversation = this.conversation.slice(0, -1)
          this._isProcessing = false
          this.notifyStateChange()
        }
      }
    }
    this.ws.onclose = (event) => {
      this.log('[WS] Closed', event)
      this.stop()

      const error = getClientErrorFromWSCloseEvent(event)
      if (error) {
        this.emit('Error', error)
      }
    }
    this.ws.onerror = (event) => {
      console.error('[MicdropClient] [WS] Error:', event)
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

  private addMessage(message: MicdropConversationMessage) {
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
