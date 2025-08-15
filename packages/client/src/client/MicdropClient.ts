import { EventEmitter } from 'eventemitter3'
import { Mic, Speaker, VAD } from '../audio'
import { MicRecorder } from '../audio/MicRecorder'
import { VADConfig } from '../audio/vad/getVAD'
import {
  MicdropClientCommands,
  MicdropConversation,
  MicdropConversationItem,
  MicdropServerCommands,
  MicdropToolCall,
} from '../types'
import {
  getClientErrorFromWSCloseEvent,
  MicdropClientError,
  MicdropClientErrorCode,
} from './MicdropClientError'

export interface MicdropEvents {
  EndCall: []
  Error: [MicdropClientError]
  StateChange: [MicdropState]
  ToolCall: [MicdropToolCall]
}

export interface MicdropOptions {
  url?: string
  params?: Record<string, any>
  vad?: VADConfig
  disableInterruption?: boolean
  debugLog?: boolean
}

export interface MicdropState {
  isStarting: boolean
  isStarted: boolean
  isPaused: boolean
  isListening: boolean
  isProcessing: boolean
  isUserSpeaking: boolean
  isAssistantSpeaking: boolean
  isMicStarted: boolean
  isMicMuted: boolean
  micDeviceId: string | undefined
  speakerDeviceId: string | undefined
  micDevices: MediaDeviceInfo[]
  speakerDevices: MediaDeviceInfo[]
  conversation: MicdropConversation
  error: MicdropClientError | undefined
}

export class MicdropClient
  extends EventEmitter<MicdropEvents>
  implements MicdropState
{
  public micRecorder?: MicRecorder
  public conversation: MicdropConversation = []
  public error: MicdropClientError | undefined
  public speakerDevices: MediaDeviceInfo[] = []
  public micDevices: MediaDeviceInfo[] = []

  private ws?: WebSocket
  private micStream?: MediaStream
  private startTime = 0
  private _isProcessing = false
  private _isPaused = false

  constructor(public options: MicdropOptions = {}) {
    super()

    // Add speaker listener
    Speaker.on('StartPlaying', this.onSpeakerStartPlaying)
    Speaker.on('StopPlaying', this.onSpeakerStopPlaying)

    // Listen to device changes
    navigator.mediaDevices.addEventListener('devicechange', this.updateDevices)
  }

  get vad(): VAD | undefined {
    return this.micRecorder?.vad
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
    return Speaker.isPlaying
  }

  get micDeviceId(): string | undefined {
    return Mic.deviceId
  }

  get speakerDeviceId(): string | undefined {
    return Speaker.deviceId
  }

  get state(): MicdropState {
    return {
      isStarting: this.isStarting,
      isStarted: this.isStarted,
      isPaused: this.isPaused,
      isListening: this.isListening,
      isProcessing: this.isProcessing,
      isUserSpeaking: this.isUserSpeaking,
      isAssistantSpeaking: this.isAssistantSpeaking,
      isMicStarted: this.isMicStarted,
      isMicMuted: this.isMicMuted,
      conversation: this.conversation,
      error: this.error,
      micDeviceId: this.micDeviceId,
      speakerDeviceId: this.speakerDeviceId,
      micDevices: this.micDevices,
      speakerDevices: this.speakerDevices,
    }
  }

  start = async (options?: MicdropOptions) => {
    this.error = undefined
    this.options = { ...this.options, ...options }

    // Reset state
    this.startTime = Date.now()
    this.conversation = []
    this._isProcessing = true
    this._isPaused = false

    // Start mic if not already started
    await this.startMic({ record: true })

    // Start websocket
    await this.startWS()
  }

  stop = async () => {
    this._isProcessing = false
    this._isPaused = false
    try {
      // Stop websocket
      this.stopWS()
    } catch (error) {
      console.error('[MicdropClient] Error stopping WebSocket', error)
    }

    try {
      // Stop microphone
      this.micRecorder?.stop()
      this.stopMic()
    } catch (error) {
      console.error('[MicdropClient] Error stopping microphone', error)
    }

    // Stop speaker
    Speaker.stopAudio()
  }

  pause = () => {
    if (this.isPaused) return
    this.micRecorder?.mute()
    this._isPaused = true
    this._isProcessing = false
    this.notifyStateChange()
    Speaker.stopAudio()
    this.ws?.send(MicdropClientCommands.Mute)
  }

  resume = () => {
    if (!this.isPaused) return
    this.micRecorder?.unmute()
    this._isPaused = false
    this.notifyStateChange()
  }

  startMic = async (
    options: {
      vad?: VADConfig
      deviceId?: string
      record?: boolean
    } = {}
  ) => {
    this.error = undefined
    if (options.vad) {
      this.options.vad = options.vad
    }
    try {
      if (!this.micRecorder) {
        this.micRecorder = new MicRecorder(this.options.vad)

        // Notify mic recorder state change
        this.micRecorder.on('StateChange', () => {
          this.notifyStateChange()
        })

        // Send chunk of user speech to server
        this.micRecorder.on('Chunk', (blob) => {
          this.log(`[MicdropClient] User audio chunk`, blob)
          this.ws?.send(blob)
        })

        // Notify server that user started speaking
        this.micRecorder.on('StartSpeaking', () => {
          this.log('User start speaking')
          this.ws?.send(MicdropClientCommands.StartSpeaking)
          // Interruption
          this._isProcessing = false
          this.notifyStateChange()
          Speaker.stopAudio()
        })

        // Notify server that user speech is complete
        this.micRecorder.on('StopSpeaking', () => {
          this.log('User stop speaking')
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
      const micStream = await Mic.start(options.deviceId)
      this.micStream = micStream

      // Restart recorder if it was running
      if (isRecorderStarted || options.record) {
        await this.micRecorder.start(micStream)
      }

      // Get devices after starting mic
      // It's necessary for Firefox that return an empty list before any stream is started
      await this.updateDevices()

      // Start speaker
      // Must be after devices update
      await Speaker.start()

      this.notifyStateChange()
    } catch (error) {
      this.setError(
        new MicdropClientError(
          MicdropClientErrorCode.Mic,
          (error as any)?.message
        )
      )
      await this.stop()
      throw error
    }
  }

  changeMicDevice = async (deviceId: string) => {
    await this.startMic({ deviceId })
  }

  changeSpeakerDevice = async (deviceId: string) => {
    await Speaker.changeDevice(deviceId)
    this.notifyStateChange()
  }

  private stopMic() {
    this.micRecorder?.stop()
    this.micRecorder = undefined
    Mic.stop()
    this.micStream = undefined
    this.notifyStateChange()
  }

  private updateDevices = async () => {
    const rawDevices = await navigator.mediaDevices.enumerateDevices()
    if (rawDevices.length === 0) return

    // Move default devices to the beginning of the list
    // and get rid of devices with deviceId=default
    const defaultDevices = rawDevices.filter(
      (device) => device.deviceId === 'default'
    )
    const devices = rawDevices.filter((device) => device.deviceId !== 'default')
    const defaultDevicesIndexes = defaultDevices
      .map((device) =>
        devices.findIndex(
          (d) => d.groupId === device.groupId && d.kind === device.kind
        )
      )
      .filter((index) => index !== -1)
    for (const index of defaultDevicesIndexes) {
      const device = devices[index]
      devices.splice(index, 1)
      devices.unshift(device)
    }

    this.micDevices = devices.filter((device) => device.kind === 'audioinput')
    this.speakerDevices = devices.filter(
      (device) => device.kind === 'audiooutput'
    )
    Speaker.devices = this.speakerDevices

    this.notifyStateChange()
  }

  private async startWS() {
    try {
      if (this.ws) {
        this.log('WebSocket is already started')
        return
      }
      if (!this.isMicStarted) {
        throw new MicdropClientError(MicdropClientErrorCode.Mic)
      }
      if (!this.options.url) {
        throw new MicdropClientError(MicdropClientErrorCode.MissingUrl)
      }

      // Start websocket
      this.ws = new WebSocket(this.options.url)
      this.ws.binaryType = 'blob'
      this.notifyStateChange()

      // Events
      this.ws.onopen = this.onWSOpen
      this.ws.onmessage = this.onWSMessage
      this.ws.onclose = this.onWSClose
      this.ws.onerror = this.onWSError
    } catch (error) {
      this.setError(
        new MicdropClientError(
          MicdropClientErrorCode.Connection,
          (error as any)?.message
        )
      )
      await this.stop()
      throw error
    }
  }

  private onWSOpen = () => {
    this.log('WebSocket opened')
    this.notifyStateChange()

    // Send params
    if (this.options.params) {
      this.ws?.send(JSON.stringify(this.options.params))
    }
  }

  private onWSMessage = (event: MessageEvent) => {
    this.log('Received message:', event.data)
    if (event.data instanceof Blob) {
      // Received assistant speech
      if (this.isPaused || this.isUserSpeaking) return
      Speaker.playAudio(event.data)
      this._isProcessing = false
      this.notifyStateChange()
    } else if (typeof event.data !== 'string') {
      console.warn(`[MicdropClient] Unknown message type: ${event.data}`)
    } else if (event.data.startsWith(MicdropServerCommands.Message)) {
      // Received user/assistant message
      try {
        const message = JSON.parse(
          event.data.substring(MicdropServerCommands.Message.length + 1)
        )
        this._isProcessing = false
        this.addMessage(message)
      } catch (error) {
        console.error(
          '[MicdropClient] Error parsing message:',
          event.data,
          error
        )
      }
    } else if (event.data === MicdropServerCommands.EndCall) {
      // Call ended
      this.emit('EndCall')
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
    } else if (event.data.startsWith(MicdropServerCommands.ToolCall)) {
      // Received tool call information
      try {
        const toolCall = JSON.parse(
          event.data.substring(MicdropServerCommands.ToolCall.length + 1)
        )
        this.emit('ToolCall', toolCall)
      } catch (error) {
        console.error(
          '[MicdropClient] Error parsing tool call:',
          event.data,
          error
        )
      }
    }
  }

  private onWSClose = (event: CloseEvent) => {
    this.log('WebSocket closed', event)
    this.stop()

    const error = getClientErrorFromWSCloseEvent(event)
    if (error) {
      this.setError(error)
    }
  }

  private onWSError = (event: Event) => {
    this.setError(new MicdropClientError(MicdropClientErrorCode.Connection))
    this.stop()
  }

  private stopWS() {
    if (!this.ws) return
    if (
      this.ws.readyState === WebSocket.OPEN ||
      this.ws.readyState === WebSocket.CONNECTING
    ) {
      this.ws.close()
    }
    this.ws = undefined
    this.notifyStateChange()
  }

  private onSpeakerStartPlaying = () => {
    this.log('Speaker started')
    if (this.options.disableInterruption && !this.isPaused) {
      this.micRecorder?.mute()
    }
    this.notifyStateChange()
  }

  private onSpeakerStopPlaying = () => {
    this.log('Speaker stopped')
    if (this.options.disableInterruption && !this.isPaused) {
      this.micRecorder?.unmute()
    }
    this.notifyStateChange()
  }

  private addMessage(message: MicdropConversationItem) {
    this.conversation = [...this.conversation, message]
    this.notifyStateChange()
  }

  private setError(error: MicdropClientError) {
    console.error('[MicdropClient] Error:', error)
    this.error = error
    this.notifyStateChange()
    this.emit('Error', error)
  }

  private notifyStateChange() {
    this.emit('StateChange', this.state)
  }

  private log(...message: any[]) {
    if (!this.options.debugLog) return
    console.log(`[MicdropClient ${Date.now() - this.startTime}]`, ...message)
  }
}
