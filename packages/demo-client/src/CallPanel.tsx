import { useContext } from 'react'
import { FaPause, FaPlay, FaStop } from 'react-icons/fa'
import { CallContext } from './CallContext'
import CallStatusCircle from './CallStatusCircle'
import DevicesSettings from './DevicesSettings'

export default function CallPanel() {
  const call = useContext(CallContext)
  if (!call) return null

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <CallStatusCircle size={40} />
        {call.isStarted ? (
          <>
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
        <div className="space-y-4">
          {call.conversation.map(({ role, content }, index) => (
            <div
              key={index}
              className={`max-w-[80%] p-3 rounded-xl ${
                role === 'assistant'
                  ? 'bg-green-100 ml-0 mr-auto rounded-bl-none'
                  : role === 'user'
                    ? 'bg-gray-100 ml-auto mr-0 rounded-br-none'
                    : 'bg-gray-50 mx-auto'
              }`}
            >
              {content}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
