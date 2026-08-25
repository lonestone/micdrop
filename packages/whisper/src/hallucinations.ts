/**
 * Whisper describes what it hears even when nobody spoke, so a breath or a
 * door closing comes back as a sound tag, a music note, or one of the subtitle
 * credits its training data is full of. Micdrop calls the STT once per
 * utterance detected by the VAD, and the VAD does fire on non-speech, so these
 * show up regularly and would be answered as if the user had said them.
 *
 * Only outputs that carry no speech at all are dropped. A transcript mixing a
 * tag and real words keeps its words.
 */

// Whole-output tags: "[BLANK_AUDIO]", "(soft music)", "♪♪♪", "..."
const NON_SPEECH_ONLY = /^[\s.…♪*]*(\[[^\]]*\]|\([^)]*\)|\*[^*]*\*)?[\s.…♪*]*$/

// Subtitle credits, recognizable enough to be safe to drop wholesale
const CREDITS = [
  /sous-titr\w+ (réalisé|par|effectué)/i,
  /amara\.org/i,
  /subtitle[sd]? by/i,
  /sub(title)?s? (by|created by)/i,
  /transcription (par|by)/i,
  /merci d'avoir regardé/i,
  /thanks? for watching/i,
  /napisy (stworzone|wygenerowane)/i,
]

/**
 * Returns the transcript to use, or an empty string when the model heard no
 * speech. An empty transcript tells MicdropServer to skip the answer.
 */
export function filterHallucination(transcript: string): string {
  const text = transcript.trim()
  if (!text) return ''
  if (NON_SPEECH_ONLY.test(text)) return ''
  if (CREDITS.some((pattern) => pattern.test(text))) return ''
  return text
}
