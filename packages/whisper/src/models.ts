/**
 * Whisper checkpoints converted to ONNX by the community, as shorthands for
 * the repositories holding them. Any other repository holding an ONNX export
 * of Whisper works too, the list is a shortcut for the common ones.
 *
 * The generic checkpoints trade accuracy for speed as they grow. The ones tied
 * to a language are worth more than their size suggests: `french` is the size
 * of `small` and transcribes French better than `turbo`, which is four times
 * heavier, because it was fine-tuned on French rather than on a hundred
 * languages at once.
 */
export const WHISPER_MODELS = {
  tiny: 'onnx-community/whisper-tiny',
  base: 'onnx-community/whisper-base',
  small: 'onnx-community/whisper-small',
  turbo: 'onnx-community/whisper-large-v3-turbo',
  french: 'onnx-community/whisper-small-cv11-french-ONNX',
} as const

export type WhisperModelName = keyof typeof WHISPER_MODELS

export interface WhisperModelInfo {
  /** Human readable name, with what the checkpoint is good for. */
  label: string
  /** Set when the checkpoint only handles one language. */
  language?: string
}

export const WHISPER_MODEL_INFO: Record<WhisperModelName, WhisperModelInfo> = {
  tiny: { label: 'tiny (fastest, least accurate)' },
  base: { label: 'base (good balance)' },
  small: { label: 'small (slower, more accurate)' },
  turbo: { label: 'large-v3-turbo (heaviest, most accurate)' },
  french: {
    label: 'small French (best in French, small cost)',
    language: 'fr',
  },
}

/** Resolves a shorthand ("base") or passes a repository id through. */
export function resolveModel(model: string): string {
  return WHISPER_MODELS[model as WhisperModelName] ?? model
}
