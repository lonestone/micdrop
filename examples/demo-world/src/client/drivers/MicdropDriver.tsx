import {
  audioContext,
  getSpeakerOutput,
  Micdrop,
  MicdropToolCall,
} from '@micdrop/web'
import { useMicdropState } from '@micdrop/react'
import { useEffect } from 'react'
import { WorldUpdate } from '../../shared/protocol'
import { hearVoice } from '../store/voiceLevel'
import { Status, worldStore } from '../store/WorldStore'

/**
 * The bridge, and the only file in the interface that knows Micdrop exists.
 *
 * Server tools carry a full world update, so a single handler covers all of
 * them: the scene reacts to a tool call while she is still speaking, which is
 * what makes the transformation feel simultaneous with her voice rather than
 * queued behind it.
 */
export default function MicdropDriver() {
  const state = useMicdropState()

  useEffect(() => {
    const handleToolCall = (toolCall: MicdropToolCall) => {
      const update = toolCall.output as WorldUpdate | undefined
      if (update?.world) worldStore.applyUpdate(update)
    }
    Micdrop.on('ToolCall', handleToolCall)
    return () => {
      Micdrop.off('ToolCall', handleToolCall)
    }
  }, [])

  // The scene shapes her voice into a body, and this is where it gets to hear
  // it. Handed over as a node rather than as a number, so the shells can read
  // the envelope on their own frames instead of on the meter's ten a second.
  useEffect(() => {
    if (!state.isStarted) return
    const output = getSpeakerOutput()
    if (!output) return

    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.1
    output.connect(analyser)
    hearVoice(analyser)

    return () => {
      hearVoice(undefined)
      output.disconnect(analyser)
    }
  }, [state.isStarted])

  useEffect(() => {
    worldStore.setStatus(toStatus(state))
  }, [
    state.isStarted,
    state.isProcessing,
    state.isAssistantSpeaking,
    state.isUserSpeaking,
  ])

  useEffect(() => {
    const last = [...state.conversation]
      .reverse()
      .find(
        (item) =>
          (item.role === 'assistant' || item.role === 'user') &&
          'content' in item &&
          item.content.trim()
      )
    if (!last || !('content' in last)) return

    // The people speak through her, so their lines also come back as assistant
    // messages. Whoever the store already credited a line to keeps it, which is
    // the whole cost of giving a civilisation its own voice without a second
    // synthesis.
    const current = worldStore.getSnapshot().subtitle
    if (current?.text === last.content) return

    worldStore.setSubtitle({
      text: last.content,
      from: last.role === 'assistant' ? 'planet' : 'user',
    })
  }, [state.conversation])

  return null
}

function toStatus(state: {
  isStarted: boolean
  isProcessing: boolean
  isAssistantSpeaking: boolean
}): Status {
  if (!state.isStarted) return 'offline'
  if (state.isAssistantSpeaking) return 'speaking'
  if (state.isProcessing) return 'thinking'
  return 'listening'
}
