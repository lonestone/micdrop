import { useContext } from 'react'
import { FaPause, FaPlay, FaStop } from 'react-icons/fa'
import { CallContext } from './CallContext'
import DevicesSettings from './DevicesSettings'

export default function CallPanel() {
  const call = useContext(CallContext)!

  return (
    <div className="flex flex-col space-y-5">
      <div className="flex items-center gap-2">
        {call.isStarted ? (
          <>
            <div
              className={`w-5 h-5 rounded-full ${
                call.isPaused
                  ? 'bg-gray-500'
                  : call.isSpeaking
                    ? 'bg-green-500'
                    : 'bg-blue-500'
              }`}
            />
            {call.isPaused ? (
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={call.resume}
              >
                <FaPlay size={18} className="mr-2" />
                Resume
              </button>
            ) : (
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={call.pause}
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
            onClick={call.start}
          >
            <FaPlay size={18} className="mr-2" />
            Start call
          </button>
        ) : (
          <>
            <button
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => call.startMic()}
            >
              Start mic
            </button>
          </>
        )}

        {call.isMicStarted && (
          <button
            className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={call.stop}
          >
            <FaStop size={18} className="mr-2" />
            Stop
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

      {call.isMicStarted && <DevicesSettings />}

      {call.conversation.length !== 0 && (
        <ul className="list-disc pl-5">
          {call.conversation.map(({ role, content }, index) => (
            <li key={index} className="mb-2">
              <span className="font-bold">{role}:</span> {content}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
