import pcmProcessorWorklet from './pcm-processor-worklet?raw'
import { audioContext } from './utils/audioContext'

declare global {
  interface Window {
    micdropPcmProcessor: boolean
  }
}

export async function initPcmProcessor() {
  if (window.micdropPcmProcessor) return
  window.micdropPcmProcessor = true

  // Init worklet URL
  const workletBlob = new Blob([pcmProcessorWorklet], {
    type: 'application/javascript',
  })
  const workletUrl = URL.createObjectURL(workletBlob)

  // Load the worklet module
  await audioContext.audioWorklet.addModule(workletUrl)
}
