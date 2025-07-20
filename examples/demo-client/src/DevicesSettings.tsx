import { Micdrop } from '@micdrop/client'
import { FaMicrophone, FaVolumeUp } from 'react-icons/fa'
import MicVolume from './MicVolume'
import SpeakerTestButton from './SpeakerTestButton'
import { useMicdropState } from './useMicdropState'

export default function DevicesSettings() {
  const {
    isMicStarted,
    micDeviceId,
    micDevices,
    speakerDeviceId,
    speakerDevices,
  } = useMicdropState()
  if (!isMicStarted) return null

  return (
    <div className="p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        <FaMicrophone className="text-gray-600 text-xl" />
        <select
          value={micDeviceId}
          className="flex-1 form-select min-w-0 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 py-2"
          onChange={(event) => Micdrop.changeMicDevice(event.target.value)}
        >
          {micDevices.map(({ deviceId, label }) => (
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
          value={speakerDeviceId}
          className="flex-1 form-select min-w-0 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 py-2"
          onChange={(event) => Micdrop.changeSpeakerDevice(event.target.value)}
        >
          {speakerDevices.map(({ deviceId, label }) => (
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
