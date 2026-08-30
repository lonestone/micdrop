import { MicDriver, MicdropDevice } from '@micdrop/client'
import {
  AudioManager,
  AudioRecorder,
  RecorderAdapterNode,
} from 'react-native-audio-api'
import { getAudioContext } from './context'

const SAMPLE_RATE = 16000
// Samples asked of the recorder for each callback, about 20 ms at 16 kHz
const BUFFER_LENGTH = 320

/**
 * Records the microphone with `react-native-audio-api`.
 *
 * The audio session is configured for a phone call: the operating system then
 * applies echo cancellation, which keeps the assistant voice out of what is
 * recorded.
 */
export class NativeMic extends MicDriver {
  private recorder: AudioRecorder | undefined
  private adapter: RecorderAdapterNode | undefined
  private _deviceId: string | undefined
  private _isStarted = false

  get isStarted(): boolean {
    return this._isStarted
  }

  get deviceId(): string | undefined {
    return this._deviceId
  }

  async start(deviceId?: string): Promise<void> {
    if (this._isStarted) {
      if (deviceId === this._deviceId) return
      // Tear the graph down without releasing the session, the call goes on
      await this.teardown()
    }

    const permission = await AudioManager.requestRecordingPermissions()
    if (permission !== 'Granted') {
      throw new Error(`Microphone permission ${permission.toLowerCase()}`)
    }

    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'voiceChat',
      iosOptions: [
        'defaultToSpeaker',
        'allowBluetoothHFP',
        'allowBluetoothA2DP',
      ],
    })
    await AudioManager.setAudioSessionActivity(true)

    if (deviceId) {
      await AudioManager.setInputDevice(deviceId)
    }
    this._deviceId = deviceId

    // The recorder feeds the audio graph through an adapter node, so the
    // captured sound stays available to the rest of the graph
    const context = getAudioContext()
    this.adapter = context.createRecorderAdapter()

    this.recorder = new AudioRecorder()
    this.recorder.connect(this.adapter)
    this.recorder.onError(({ message }) =>
      this.emit('Error', new Error(message))
    )
    this.recorder.onAudioReady(
      {
        sampleRate: SAMPLE_RATE,
        bufferLength: BUFFER_LENGTH,
        channelCount: 1,
      },
      ({ buffer }) => {
        // The native buffer is reused between callbacks, so keep a copy
        const frames = Float32Array.from(buffer.getChannelData(0))
        this.emit('Frames', frames, buffer.sampleRate)
      }
    )

    const result = await this.recorder.start()
    if (result.status === 'error') {
      await this.teardown()
      throw new Error(result.message)
    }
    this._isStarted = true
  }

  async stop(): Promise<void> {
    await this.teardown()

    // Hand the audio session back, so the phone leaves call mode and whatever
    // was playing before can resume
    try {
      await AudioManager.setAudioSessionActivity(false)
    } catch (error) {
      console.error('[Micdrop] Error releasing the audio session', error)
    }
  }

  private async teardown(): Promise<void> {
    this._isStarted = false
    try {
      this.recorder?.clearOnAudioReady()
      this.recorder?.clearOnError()
      await this.recorder?.stop()
      this.recorder?.disconnect()
    } catch (error) {
      console.error('[Micdrop] Error stopping the recorder', error)
    }
    this.recorder = undefined

    this.adapter?.disconnect()
    this.adapter = undefined
  }

  async getDevices(): Promise<MicdropDevice[]> {
    const { availableInputs } = await AudioManager.getDevicesInfo()
    return availableInputs.map(({ id, name }) => ({
      id,
      label: name,
      kind: 'audioinput' as const,
    }))
  }
}
