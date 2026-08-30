import { Micdrop, MicdropToolCall } from '@micdrop/client'
import { useEffect } from 'react'

/**
 * Hook to handle ToolCall events
 * @param onToolCall - Callback function that will be called when the agent runs a tool
 */
export function useMicdropToolCall(
  onToolCall: (toolCall: MicdropToolCall) => void
) {
  useEffect(() => {
    // Subscribe to ToolCall event
    Micdrop.on('ToolCall', onToolCall)
    return () => {
      Micdrop.off('ToolCall', onToolCall)
    }
  }, [onToolCall])
}
