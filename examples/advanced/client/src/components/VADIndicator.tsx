import { VAD, VADStatus } from '@micdrop/web'
import { useEffect, useState } from 'react'
import StatusDot, { DotTone } from './ui/StatusDot'

const TONES: Record<VADStatus, { tone: DotTone; label: string }> = {
  [VADStatus.Silence]: { tone: 'idle', label: 'Hearing silence' },
  [VADStatus.MaybeSpeaking]: { tone: 'warn', label: 'Might be speech' },
  [VADStatus.Speaking]: { tone: 'accent', label: 'Hearing speech' },
}

/** What one voice detector is hearing, right now */
export default function VADIndicator({ vad }: { vad: VAD }) {
  const [status, setStatus] = useState<VADStatus>(vad.status)

  useEffect(() => {
    const handleStatusChange = (status: VADStatus) => setStatus(status)
    vad.on('ChangeStatus', handleStatusChange)
    return () => {
      vad.off('ChangeStatus', handleStatusChange)
    }
  }, [vad])

  return <StatusDot tone={TONES[status].tone} label={TONES[status].label} />
}
