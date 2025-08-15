import { Micdrop, Speaker } from '@micdrop/client'
import { useMicdropEndCall, useMicdropState } from '@micdrop/react'
import { FaMicrophone, FaPause, FaPlay, FaStop } from 'react-icons/fa'
import CallStatusCircle from './CallStatusCircle'

export default function CallControls() {
  const { isStarted, isPaused, isMicStarted, isStarting, error } =
    useMicdropState()

  useMicdropEndCall(() => {
    console.log('Call ended')

    // Stop after last speech end
    setTimeout(async () => {
      if (Speaker.isPlaying) {
        Speaker.on('StopPlaying', Micdrop.stop)
      } else {
        Micdrop.stop()
      }
    }, 5000)
  })

  const handleStart = async () => {
    await Micdrop.start({
      url: 'ws://localhost:8081/call',
      params: {
        authorization: '1234',
        lang: navigator.language,
      },
      vad: ['silero', 'volume'],
      debugLog: true,
    })
  }

  return (
    <div className="flex items-center gap-2">
      <CallStatusCircle size={40} />
      {isStarted ? (
        <>
          {isPaused ? (
            <button
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={Micdrop.resume}
            >
              <FaPlay size={18} className="mr-2" />
              Resume
            </button>
          ) : (
            <button
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={Micdrop.pause}
            >
              <FaPause size={18} className="mr-2" />
              Mute
            </button>
          )}
        </>
      ) : isMicStarted ? (
        <button
          className={`inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
            isStarting ? 'opacity-75 cursor-wait' : ''
          }`}
          disabled={isStarting}
          onClick={handleStart}
        >
          <FaPlay size={18} className="mr-2" />
          Start call
        </button>
      ) : (
        <>
          <button
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() =>
              Micdrop.startMic({ vad: ['silero', 'volume'], record: true })
            }
          >
            <FaMicrophone size={18} className="mr-2" />
            Start mic
          </button>
        </>
      )}

      {isMicStarted && (
        <button
          className="inline-flex items-center px-4 py-[6px] border-2 border-red-500 text-red-500 rounded hover:bg-red-50"
          onClick={Micdrop.stop}
        >
          <FaStop size={18} className="mr-2" />
          {isStarted ? 'Stop call' : 'Stop mic'}
        </button>
      )}

      {error && (
        <div className="text-sm text-red-500">
          Error: {error.code}
          {error.message && (
            <>
              <br />
              {error.message}
            </>
          )}
        </div>
      )}
    </div>
  )
}
