/**
 * Stops a stream
 * @param stream - The stream to stop
 */
export function stopStream(stream?: MediaStream) {
  stream?.getTracks().forEach((track) => track.stop())
}
