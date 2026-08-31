import { useMicdropState } from '@micdrop/react'
import { useProviders } from '../providers'

/**
 * The system prompt given to the agent, written for the next call.
 *
 * The demo starts from the prompt of the server and keeps whatever is written
 * here in the browser storage, so trying a persona, a script or a whole other
 * task is a matter of typing rather than of editing the server and restarting
 * it. The language of the conversation stays with the server, which resolves
 * it from the voice and the transcription model.
 */
export default function PromptSettings() {
  const { isStarted } = useMicdropState()
  const { prompt, writePrompt } = useProviders()

  if (prompt === undefined) return null

  return (
    <div className="flex items-start gap-3">
      <span className="w-32 shrink-0 pt-0.5 text-sm text-gray-600">
        System prompt
      </span>
      <textarea
        className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1 font-mono text-xs shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:bg-gray-100 disabled:text-gray-400"
        rows={8}
        spellCheck={false}
        value={prompt}
        disabled={isStarted}
        aria-label="System prompt"
        onChange={(event) => writePrompt(event.target.value)}
      />
    </div>
  )
}
