import { MicDriver, MicdropDevice } from '@micdrop/client'
import { audioContext } from './audioContext'
import { initPcmProcessor } from './pcm-processor'
import { stopStream } from './stopStream'

/**
 * Records the microphone with the Web Audio API.
 *
 * An audio worklet delivers the samples at a steady pace, and everything that
 * happens to them afterwards lives in `@micdrop/client`.
 */
export class WebMic extends MicDriver {
  private stream: MediaStream | undefined
  private source: MediaStreamAudioSourceNode | undefined
  private worklet: AudioWorkletNode | undefined
  private _deviceId: string | undefined

  get isStarted(): boolean {
    return !!this.stream
  }

  get deviceId(): string | undefined {
    return this._deviceId
  }

  async start(deviceId?: string): Promise<void> {
    if (this.stream) {
      // Same device, keep recording
      if (this._deviceId === deviceId) return
      await this.stop()
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { ideal: deviceId },
        sampleRate: 16000, // not working, it will follow device settings, usually 44.1kHz
        sampleSize: 16,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    })

    // Remember which device the browser settled on
    const track = this.stream.getTracks()[0]
    const settled = track?.getCapabilities?.().deviceId
    this._deviceId =
      settled && settled !== 'default' ? settled : (deviceId ?? settled)

    await initPcmProcessor()
    this.worklet = new AudioWorkletNode(audioContext, 'pcm-processor')
    this.worklet.port.onmessage = this.onWorkletMessage

    this.source = audioContext.createMediaStreamSource(this.stream)
    this.source.connect(this.worklet)

    // A browser only reveals the device labels once a stream is running, and
    // Firefox lists nothing at all before that
    navigator.mediaDevices.addEventListener('devicechange', this.onDeviceChange)
  }

  async stop(): Promise<void> {
    navigator.mediaDevices.removeEventListener(
      'devicechange',
      this.onDeviceChange
    )
    if (this.worklet) {
      this.worklet.port.onmessage = null
      this.worklet.disconnect()
      this.worklet = undefined
    }
    if (this.source) {
      this.source.disconnect()
      this.source = undefined
    }
    if (this.stream) {
      stopStream(this.stream)
      this.stream = undefined
    }
  }

  async getDevices(): Promise<MicdropDevice[]> {
    return listDevices('audioinput')
  }

  private onWorkletMessage = (event: MessageEvent) => {
    const { type, frames, sampleRate } = event.data
    if (type !== 'frames') return
    this.emit('Frames', frames as Float32Array, sampleRate as number)
  }

  private onDeviceChange = () => {
    this.emit('DeviceChange')
  }
}

/**
 * Lists the devices of one kind, the default one first
 * @param kind - Which devices to list
 */
export async function listDevices(
  kind: 'audioinput' | 'audiooutput'
): Promise<MicdropDevice[]> {
  const all = await navigator.mediaDevices.enumerateDevices()
  if (all.length === 0) return []

  // A browser lists the default device twice, once under the id "default" and
  // once under its real id. Keep the real one, and put it first.
  const defaults = all.filter((device) => device.deviceId === 'default')
  const devices = all.filter(
    (device) => device.deviceId !== 'default' && device.kind === kind
  )
  for (const fallback of defaults) {
    const index = devices.findIndex(
      (device) => device.groupId === fallback.groupId
    )
    if (index > 0) devices.unshift(...devices.splice(index, 1))
  }

  return devices.map((device) => ({
    id: device.deviceId,
    label: device.label || (kind === 'audioinput' ? 'Microphone' : 'Speaker'),
    kind,
  }))
}
