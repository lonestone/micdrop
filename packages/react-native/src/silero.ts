import { setSileroModelLoader } from '@micdrop/client'
import { OnnxSileroModel, OnnxSileroOptions } from './vad/OnnxSileroModel'

export * from './vad/OnnxSileroModel'

let options: OnnxSileroOptions = {}

/**
 * Says where the Silero model comes from, to ship it with the app rather than
 * fetching it on the first call.
 * @param next - Address, file or bytes of the model
 */
export function setSileroOptions(next: OnnxSileroOptions) {
  options = next
}

// The native ONNX runtime adds a good chunk to the app, so it is only linked
// in when this file is imported
setSileroModelLoader(async () => {
  const model = new OnnxSileroModel(options)
  await model.load()
  return model
})
