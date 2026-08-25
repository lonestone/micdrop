/**
 * Kokoro ships every voice in one checkpoint, so switching voice costs nothing
 * at runtime. The prefix says the accent and the gender: "af" and "am" are
 * American female and male, "bf" and "bm" British.
 *
 * The upstream model also holds French, Italian, Japanese, Portuguese and
 * Chinese voices, but kokoro-js phonemizes everything as English, so those
 * voices would read foreign words with an English pronunciation. Reach for
 * @micdrop/piper when the call is in another language.
 */
export const KOKORO_VOICES = {
  americanFemale: 'af_heart',
  americanMale: 'am_michael',
  britishFemale: 'bf_emma',
  britishMale: 'bm_george',
} as const

export type KokoroVoiceName = keyof typeof KOKORO_VOICES

/**
 * Every voice the model exposes, graded by its author from A to F. The ones
 * above are the best of each accent and gender, the rest are here for variety.
 */
export const KOKORO_VOICE_IDS = [
  'af_heart',
  'af_alloy',
  'af_aoede',
  'af_bella',
  'af_jessica',
  'af_kore',
  'af_nicole',
  'af_nova',
  'af_river',
  'af_sarah',
  'af_sky',
  'am_adam',
  'am_echo',
  'am_eric',
  'am_fenrir',
  'am_liam',
  'am_michael',
  'am_onyx',
  'am_puck',
  'am_santa',
  'bf_alice',
  'bf_emma',
  'bf_isabella',
  'bf_lily',
  'bm_daniel',
  'bm_fable',
  'bm_george',
  'bm_lewis',
] as const

/** Resolves a shorthand ("britishFemale") or passes a voice id through. */
export function resolveVoice(voice: string): string {
  return KOKORO_VOICES[voice as KokoroVoiceName] ?? voice
}
