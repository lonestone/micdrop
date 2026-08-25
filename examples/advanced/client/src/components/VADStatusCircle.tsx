import { VAD, VADStatus } from '@micdrop/client'
import { useEffect, useState } from 'react'

const statusColors = {
  [VADStatus.Silence]: 'bg-gray-500',
  [VADStatus.MaybeSpeaking]: 'bg-yellow-500',
  [VADStatus.Speaking]: 'bg-green-500',
}

export default function VADStatusCircle({ vad }: { vad: VAD }) {
  const [status, setStatus] = useState<VADStatus>(vad.status)

  useEffect(() => {
    const handleStatusChange = (status: VADStatus) => setStatus(status)
    vad.on('ChangeStatus', handleStatusChange)
    return () => {
      vad.off('ChangeStatus', handleStatusChange)
    }
  }, [vad])

  return <div className={`w-4 h-4 rounded-full ${statusColors[status]}`} />
}
