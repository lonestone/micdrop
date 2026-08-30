// Inspired https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos
export function unlock(audioContext: AudioContext): void {
  const events = ['touchstart', 'touchend', 'mousedown', 'keydown']

  const unlock = async () => {
    unlockSafari(audioContext)
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }
    // Clean events
    events.forEach((e) => document.body.removeEventListener(e, unlock))
  }

  // Add events
  events.forEach((e) => document.body.addEventListener(e, unlock, false))
}

// safari/ios hack - inspired by https://codepen.io/kslstn/pen/pagLqL
// unlock audioContext - call when interactive (button click)
function unlockSafari(audioContext: AudioContext): void {
  // create empty buffer and play it to unlock audioContext when interactive
  const source = audioContext.createBufferSource()
  source.buffer = audioContext.createBuffer(1, 1, 22050)
  source.connect(audioContext.destination)
  const onEnded = () => {
    source.disconnect()
    source.buffer = null
    source.removeEventListener('ended', onEnded)
  }
  source.addEventListener('ended', onEnded)
  source.start()
}
