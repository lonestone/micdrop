import { Micdrop } from '@micdrop/client'
import { useEffect } from 'react'

/**
 * Hook to handle EndCall events
 * @param onEndCall - Callback function that will be called when the call ends
 */
export function useMicdropEndCall(onEndCall: () => void) {
  useEffect(() => {
    // Subscribe to EndCall event
    Micdrop.on('EndCall', onEndCall)
    return () => {
      Micdrop.off('EndCall', onEndCall)
    }
  }, [onEndCall])
}
