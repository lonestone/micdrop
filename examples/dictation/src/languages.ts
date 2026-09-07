// The languages the page offers, named the way each one names itself.
// Shared by the page, which builds the picker, and the server, which refuses
// anything else.

export interface Language {
  code: string
  label: string
}

export const LANGUAGES: Language[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
]

export const DEFAULT_LANGUAGE = 'en'

/** Keeps the code of a supported language, `en` for everything else */
export function toSupportedLanguage(value: string | undefined): string {
  // Browsers report a tag like "fr-CA", the transcription wants "fr"
  const code = value?.toLowerCase().split('-')[0]
  return LANGUAGES.some((language) => language.code === code)
    ? (code as string)
    : DEFAULT_LANGUAGE
}
