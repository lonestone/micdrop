import { audioContext } from './audioContext'

/**
 * Creates a delayed stream with a delay in seconds
 * @param stream - The stream to delay
 * @param delay - The delay in seconds
 * @returns The delayed stream
 */
export function createDelayedStream(
  stream: MediaStream,
  delay: number
): MediaStream {
  if (!audioContext) {
    throw new Error('AudioContext not initialized')
  }
  const audioSource = audioContext.createMediaStreamSource(stream)
  const delayNode = audioContext.createDelay(delay)
  delayNode.delayTime.value = delay
  const audioDestination = audioContext.createMediaStreamDestination()
  audioSource.connect(delayNode)
  delayNode.connect(audioDestination)
  return audioDestination.stream
}
