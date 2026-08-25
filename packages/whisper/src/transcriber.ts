import { pipeline } from '@huggingface/transformers'
import { resolveModel } from './models'

/**
 * The shape of the pipeline we use, kept structural on purpose: the exact
 * generic signature moves between Transformers.js releases, and pinning it
 * here would break the build on an upgrade that changes nothing for us.
 */
export type Transcriber = (
  audio: Float32Array,
  options?: Record<string, any>
) => Promise<{ text?: string } | Array<{ text?: string }>>

export interface TranscriberOptions {
  model: string
  dtype?: string | Record<string, string>
  device?: string
  cacheDir?: string
}

/**
 * Loading a Whisper checkpoint costs from a few hundred milliseconds to a few
 * seconds, and holding two copies of the same weights wastes the memory the
 * LLM needs. Every call sharing a configuration therefore shares one instance,
 * which stays loaded for the lifetime of the process.
 */
const transcribers = new Map<string, Promise<Transcriber>>()

function cacheKey(options: TranscriberOptions): string {
  return JSON.stringify([
    resolveModel(options.model),
    options.dtype ?? null,
    options.device ?? null,
    options.cacheDir ?? null,
  ])
}

export function loadTranscriber(
  options: TranscriberOptions
): Promise<Transcriber> {
  const key = cacheKey(options)
  const existing = transcribers.get(key)
  if (existing) return existing

  const loading = pipeline(
    'automatic-speech-recognition',
    resolveModel(options.model),
    {
      dtype: options.dtype,
      device: options.device,
      cache_dir: options.cacheDir,
    } as any
  ).then((transcriber) => transcriber as unknown as Transcriber)

  // A failed download must not poison the cache, the next call retries it
  loading.catch(() => transcribers.delete(key))

  transcribers.set(key, loading)
  return loading
}

/**
 * Runs the model once on silence.
 *
 * The first inference pays for the memory allocations and the graph warm-up,
 * which lands on the user's first sentence otherwise. Spending it while the
 * call is being set up hides it entirely.
 */
export async function warmupTranscriber(
  options: TranscriberOptions
): Promise<void> {
  const transcriber = await loadTranscriber(options)
  await transcriber(new Float32Array(16000), { language: 'en' })
}
