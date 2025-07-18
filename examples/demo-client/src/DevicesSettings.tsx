import { LocalStorageKeys, Micdrop, Speaker } from '@micdrop/client'
import { ChangeEventHandler, useEffect, useState } from 'react'
import { FaMicrophone, FaVolumeUp } from 'react-icons/fa'
import MicVolume from './MicVolume'
import SpeakerTestButton from './SpeakerTestButton'
import { useMicdropState } from './useMicdropState'

export default function DevicesSettings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>()
  const { isMicStarted } = useMicdropState()

  // Lists of available devices
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([])
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([])

  // Selected devices
  const [audioInputId, setAudioInputId] = useState(
    () => localStorage.getItem(LocalStorageKeys.MicDevice) || undefined
  )
  const [audioOutputId, setAudioOutputId] = useState(
    () => localStorage.getItem(LocalStorageKeys.SpeakerDevice) || undefined
  )

  // Get available devices
  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setAudioInputs(devices.filter((device) => device.kind === 'audioinput'))
      setAudioOutputs(devices.filter((device) => device.kind === 'audiooutput'))
    } catch (error) {
      setError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getDevices()
  }, [])

  // Change audio input (mic)
  const handleAudioInputChange: ChangeEventHandler<HTMLSelectElement> = async (
    event
  ) => {
    const deviceId = event.target.value
    setAudioInputId(deviceId)
    Micdrop.startMic({ deviceId })
  }

  // Change audio output (speaker)
  const handleAudioOutputChange: ChangeEventHandler<HTMLSelectElement> = async (
    event
  ) => {
    const deviceId = event.target.value
    setAudioOutputId(deviceId)
    Speaker.changeDevice(deviceId)
  }

  if (!isMicStarted) return null

  return (
    <div className="p-4 rounded-lg border border-gray-200 shadow-sm">
      {loading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
      {error && (
        <div className="text-red-500 p-2 rounded bg-red-50 mb-4">
          {error.message}
        </div>
      )}

      <div className="flex items-center gap-3">
        <FaMicrophone className="text-gray-600 text-xl" />
        <select
          value={audioInputId}
          className="flex-1 form-select min-w-0 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 py-2"
          onClick={getDevices}
          onChange={handleAudioInputChange}
        >
          {audioInputs.map(({ deviceId, label }) => (
            <option key={deviceId} value={deviceId}>
              {label || 'Microphone'}
            </option>
          ))}
        </select>
        <div className="w-[150px] max-w-[30%]">
          <MicVolume />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <FaVolumeUp className="text-gray-600 text-xl" />
        <select
          value={audioOutputId}
          className="flex-1 form-select min-w-0 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 py-2"
          onClick={getDevices}
          onChange={handleAudioOutputChange}
        >
          {audioOutputs.map(({ deviceId, label }) => (
            <option key={deviceId} value={deviceId}>
              {label || 'Speaker'}
            </option>
          ))}
        </select>
        <div className="w-[150px] max-w-[30%]">
          <SpeakerTestButton />
        </div>
      </div>
    </div>
  )
}
