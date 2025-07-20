import { Micdrop, MicdropState } from '@micdrop/client'
import { useEffect, useState } from 'react'

/**
 * Hook to get the complete Micdrop state
 * Subscribes to StateChange events and returns the full state
 */
export function useMicdropState(): MicdropState {
  // Initialize state with current Micdrop state
  const [state, setState] = useState<MicdropState>(() => Micdrop.state)

  useEffect(() => {
    // Subscribe to StateChange event
    Micdrop.on('StateChange', setState)
    return () => {
      Micdrop.off('StateChange', setState)
    }
  }, [])

  return state
}
