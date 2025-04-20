export const audioContext = new (window.AudioContext ||
  (window as any).webkitAudioContext)()
