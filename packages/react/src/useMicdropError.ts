import { Micdrop, MicdropClientError } from '@micdrop/client'
import { useEffect } from 'react'

/**
 * Hook to handle Error events
 * @param onError - Callback function that will be called when an error occurs
 */
export function useMicdropError(onError: (error: MicdropClientError) => void) {
  useEffect(() => {
    // Subscribe to Error event
    Micdrop.on('Error', onError)
    return () => {
      Micdrop.off('Error', onError)
    }
  }, [onError])
}
