import { useMicdropState } from '@micdrop/react'
import { PiCpuBold } from 'react-icons/pi'
import { useDetection } from '../detection'
import { useProviders } from '../providers'
import AgentOptions from './AgentOptions'
import PromptSettings from './PromptSettings'
import ProvidersFields from './ProvidersFields'
import ResetButton from './ResetButton'
import Group from './ui/Group'
import Panel from './ui/Panel'
import Switch from './ui/Switch'

/**
 * Everything the client sends when a call starts.
 *
 * These settings travel to the server rather than acting in the browser, so
 * they can only change between calls, and they sit in one panel that says so.
 * Inside it they are read as separate subjects, which is what the single
 * scrolling list they used to be never made clear.
 */
export default function ServerPanel() {
  const { isStarted } = useMicdropState()
  const { serverTurnDetection, toggleServerTurnDetection } = useDetection()
  const { resetAll } = useProviders()

  // Turn detection is stored with the other detectors, so the panel puts it
  // back itself rather than through the providers store
  const handleReset = () => {
    resetAll()
    toggleServerTurnDetection(false)
  }

  return (
    <Panel
      title="Call setup"
      icon={<PiCpuBold className="h-4 w-4" />}
      description="Sent with the connection, so a change applies to the next call."
    >
      <Group title="Providers">
        <ProvidersFields />
      </Group>

      <AgentOptions />
      <PromptSettings />

      <Group title="Turn detection" className="border-t border-line pt-4">
        <Switch
          label="Weigh turns on the server"
          help="The server reads the sound of the sentence instead of the browser. It spares the phone the model, and it can only ever decide to wait longer, never to answer sooner."
          checked={serverTurnDetection}
          disabled={isStarted}
          onChange={toggleServerTurnDetection}
        />
      </Group>

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        {isStarted && (
          <p className="text-xs text-faint">
            Stop the call to change any of this.
          </p>
        )}
        <ResetButton onClick={handleReset} disabled={isStarted} />
      </div>
    </Panel>
  )
}
