import { useMicdropState } from '@micdrop/react'
import { useDetection } from '../detection'
import { useProviders } from '../providers'
import ProvidersSettings from './ProvidersSettings'
import ResetButton from './ResetButton'

/**
 * Everything the client sends when a call starts.
 *
 * These settings travel to the server rather than acting in the browser, so
 * they can only change between calls, and they sit together above the button
 * that sends them.
 */
export default function ServerSettings({ className }: { className?: string }) {
  const { isStarted } = useMicdropState()
  const { serverTurnDetection, toggleServerTurnDetection } = useDetection()
  const { resetAll } = useProviders()

  // Turn detection is stored with the other detectors, so the card puts it
  // back itself rather than through the providers store
  const handleReset = () => {
    resetAll()
    toggleServerTurnDetection(false)
  }

  return (
    <div
      className={`border border-gray-200 shadow-sm rounded-lg ${className ?? ''}`}
    >
      <div className="flex items-center gap-2 px-4 pt-4">
        <strong>Server</strong>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <ProvidersSettings />
        <div className="flex items-start gap-3">
          <span className="w-32 shrink-0 pt-0.5 text-sm text-gray-600">
            Turn detection
          </span>
          <label
            className={`flex cursor-help items-center gap-2 text-sm ${
              isStarted ? 'text-gray-400' : 'text-gray-700'
            }`}
            title="The server reads the sound of the sentence instead of the browser. It spares the phone the model, and it can only ever decide to wait longer, never to answer sooner."
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-200 disabled:opacity-50"
              checked={serverTurnDetection}
              disabled={isStarted}
              onChange={(event) =>
                toggleServerTurnDetection(event.target.checked)
              }
            />
            Smart Turn on the server
            <span
              aria-hidden="true"
              className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600"
            >
              ?
            </span>
          </label>
        </div>
        <ResetButton onClick={handleReset} disabled={isStarted} />
      </div>
    </div>
  )
}
