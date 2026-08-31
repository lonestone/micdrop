import { MEL_BANDS, MEL_FRAMES } from './mel'

/**
 * One loaded Smart Turn model, whichever runtime holds it.
 *
 * The runtime lives outside this package: a browser runs it with
 * onnxruntime-web, a server with onnxruntime-node, a phone with
 * onnxruntime-react-native. All of them answer the same question.
 */
export interface SmartTurnModel {
  /**
   * Scores one window of audio
   * @param features - MEL_BANDS x MEL_FRAMES log mel values
   * @returns The probability that the speaker has finished, between 0 and 1
   */
  predict(features: Float32Array): Promise<number>

  /** Releases the runtime */
  release(): Promise<void>
}

/** Loads the model, which means fetching between eight and thirty megabytes */
export type SmartTurnModelLoader = () => Promise<SmartTurnModel>

// One registry for the whole app. The platform entry points are separate
// bundles, so a plain module variable would give each of them its own, and the
// one that registers the loader would never be the one that reads it.
const globalScope = globalThis as typeof globalThis & {
  micdropSmartTurnLoader?: SmartTurnModelLoader
}

/**
 * Says how the model is loaded on this platform.
 *
 * Called by `@micdrop/smart-turn/web`, `/node` and `/react-native` when they
 * are imported, so applications rarely call it themselves.
 * @param next - Loads and returns a ready to use model
 */
export function setSmartTurnModelLoader(next: SmartTurnModelLoader) {
  globalScope.micdropSmartTurnLoader = next
}

/** Loads the model registered for this platform */
export async function loadSmartTurnModel(): Promise<SmartTurnModel> {
  const loader = globalScope.micdropSmartTurnLoader
  if (!loader) {
    throw new Error(
      "No Smart Turn model. Add `import '@micdrop/smart-turn/web'` in a browser " +
        "or `import '@micdrop/smart-turn/node'` on a server, or pass your own " +
        'model to the SmartTurn constructor.'
    )
  }
  return loader()
}

/** Shape the model expects, handy when writing a runtime adapter */
export const FEATURE_SHAPE = [1, MEL_BANDS, MEL_FRAMES] as const
