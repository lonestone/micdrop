export function stopStream(stream?: MediaStream) {
  stream?.getTracks().forEach((track) => track.stop())
}
