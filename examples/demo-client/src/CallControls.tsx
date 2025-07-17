import { Micdrop } from '@micdrop/client'
import { useContext } from 'react'
import { FaMicrophone, FaPause, FaPlay, FaStop } from 'react-icons/fa'
import { CallContext } from './CallContext'
import CallStatusCircle from './CallStatusCircle'

export default function CallControls() {
  const call = useContext(CallContext)!

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
      {call.isStarted ? (
        <>
          {call.isPaused ? (
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
      ) : call.isMicStarted ? (
        <button
          className={`inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
            call.isStarting ? 'opacity-75 cursor-wait' : ''
          }`}
          disabled={call.isStarting}
          onClick={handleStart}
        >
          <FaPlay size={18} className="mr-2" />
          Start call
        </button>
      ) : (
        <>
          <button
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => Micdrop.startMic({ vad: ['silero', 'volume'] })}
          >
            <FaMicrophone size={18} className="mr-2" />
            Start mic
          </button>
        </>
      )}

      {call.isMicStarted && (
        <button
          className="inline-flex items-center px-4 py-[6px] border-2 border-red-500 text-red-500 rounded hover:bg-red-50"
          onClick={Micdrop.stop}
        >
          <FaStop size={18} className="mr-2" />
          {call.isStarted ? 'Stop call' : 'Stop mic'}
        </button>
      )}

      {call.error && (
        <div className="text-sm text-red-500">
          Error: {call.error.code}
          {call.error.message && (
            <>
              <br />
              {call.error.message}
            </>
          )}
        </div>
      )}
    </div>
  )
}
