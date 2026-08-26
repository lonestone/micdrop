import { existsSync } from 'fs'
import { join } from 'path'
import type { PocketModelConfig } from 'sherpa-onnx-node'

/**
 * The files a Pocket TTS archive holds, resolved inside its folder.
 *
 * The model ships in two flavours, quantized and full precision, which name
 * their weights `lm_main.int8.onnx` and `lm_main.onnx`. Each part is looked up
 * in that order, so both archives work and a folder mixing them takes the
 * lighter file whenever there is one, which is what the quantized archive
 * itself does for its encoder and its text conditioner.
 */

const WEIGHTS = {
  lmFlow: 'lm_flow',
  lmMain: 'lm_main',
  encoder: 'encoder',
  decoder: 'decoder',
  textConditioner: 'text_conditioner',
} as const

const JSON_FILES = {
  vocabJson: 'vocab.json',
  tokenScoresJson: 'token_scores.json',
} as const

export function resolveModelFiles(
  modelDir: string
): Omit<PocketModelConfig, 'voiceEmbeddingCacheCapacity'> {
  const files: Record<string, string> = {}
  const missing: string[] = []

  for (const [key, base] of Object.entries(WEIGHTS)) {
    const found = [`${base}.int8.onnx`, `${base}.onnx`]
      .map((name) => join(modelDir, name))
      .find(existsSync)
    if (found) files[key] = found
    else missing.push(`${base}.int8.onnx or ${base}.onnx`)
  }

  for (const [key, name] of Object.entries(JSON_FILES)) {
    const path = join(modelDir, name)
    if (existsSync(path)) files[key] = path
    else missing.push(name)
  }

  if (missing.length > 0) {
    throw new Error(
      `Pocket TTS model files not found in "${modelDir}": ${missing.join(', ')}. ` +
        'Download the archive from https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models'
    )
  }

  return files as Omit<PocketModelConfig, 'voiceEmbeddingCacheCapacity'>
}

/**
 * The reference voices the archive ships in its `test_wavs` folder.
 *
 * `bria` is a woman reading calmly for forty seconds, `loona` is a one second
 * clip, which is the shortest a reference can reasonably be, and
 * `frenchAccent` is a French speaker, cloned into English words: the language
 * comes from the text, the timbre and the accent from the recording.
 */
export const BUNDLED_VOICES = {
  bria: 'test_wavs/bria.wav',
  loona: 'test_wavs/loona.wav',
  frenchAccent: 'test_wavs/sample_fr_hibiki_crepes.wav',
} as const

export type PocketBundledVoice = keyof typeof BUNDLED_VOICES

/** Turns a bundled voice name into a path, and leaves a path as it is. */
export function resolveVoicePath(
  modelDir: string,
  voice: PocketBundledVoice | (string & {})
): string {
  const bundled = BUNDLED_VOICES[voice as PocketBundledVoice]
  return bundled ? join(modelDir, bundled) : voice
}
