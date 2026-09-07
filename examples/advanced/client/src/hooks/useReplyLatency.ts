import { Micdrop, MicdropState } from '@micdrop/web'
import { useEffect, useState } from 'react'

/** One wait, between the last word of a turn and the first sound of the answer */
export interface ReplyLatency {
  /** When the microphone stopped hearing the caller, on the performance clock */
  from: number
  /** When the first sound of the answer was played */
  to: number
  /** How long the caller waited, in milliseconds */
  ms: number
}

export interface ReplyLatencies {
  /** The waits measured since the call started, oldest first */
  measures: ReplyLatency[]
  /** When the caller stopped speaking, while the answer has yet to be heard */
  pendingSince?: number
}

/**
 * A wait this long is a call that went wrong rather than a slow answer, so it
 * is dropped instead of being counted against the average.
 */
const MAX_WAIT = 20000 // ms

/** How many waits are kept, comfortably more than the timeline can show */
const KEPT = 24

/**
 * How long the caller waits for each answer.
 *
 * The reading is taken where the caller feels it, between the moment the
 * microphone stops hearing them and the moment the first sound of the answer
 * comes out of the speaker. Everything the stack does in between, closing the
 * turn, transcribing, answering and generating the voice, lands in that one
 * number.
 */
export function useReplyLatency(): ReplyLatencies {
  const [latencies, setLatencies] = useState<ReplyLatencies>({ measures: [] })

  useEffect(() => {
    const clearPending = () =>
      setLatencies((previous) =>
        previous.pendingSince === undefined
          ? previous
          : { ...previous, pendingSince: undefined }
      )

    const handleStateChange = (state: MicdropState, previous: MicdropState) => {
      // Nothing is being waited for outside a call
      if (!state.isStarted) {
        clearPending()
        return
      }

      // A new call starts on a clean set of readings
      if (!previous.isStarted) {
        setLatencies({ measures: [] })
        return
      }

      // Speaking again replaces the wait rather than ending it: the silence
      // that follows belongs to the new turn
      if (state.isUserSpeaking && !previous.isUserSpeaking) {
        clearPending()
        return
      }

      // The end of a turn is where a wait starts being counted
      if (!state.isUserSpeaking && previous.isUserSpeaking) {
        setLatencies((current) => ({
          ...current,
          pendingSince: performance.now(),
        }))
        return
      }

      // The first sound of the answer closes it
      if (state.isAssistantSpeaking && !previous.isAssistantSpeaking) {
        const to = performance.now()
        setLatencies((current) => {
          const from = current.pendingSince
          if (from === undefined) return current
          return {
            measures: [...current.measures, { from, to, ms: to - from }].slice(
              -KEPT
            ),
            pendingSince: undefined,
          }
        })
      }
    }

    Micdrop.on('StateChange', handleStateChange)
    return () => {
      Micdrop.off('StateChange', handleStateChange)
    }
  }, [])

  // An answer that never comes leaves a counter running forever, so the wait
  // gives up on its own
  useEffect(() => {
    if (latencies.pendingSince === undefined) return
    const timer = setTimeout(() => {
      setLatencies((current) => ({ ...current, pendingSince: undefined }))
    }, MAX_WAIT)
    return () => clearTimeout(timer)
  }, [latencies.pendingSince])

  return latencies
}

/** A wait, in the unit that reads best at its length */
export function formatWait(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`
}
