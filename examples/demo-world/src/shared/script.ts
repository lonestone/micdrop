import { Localized } from './lang'

/**
 * Her opening line, written by hand rather than generated so the voice starts
 * the instant the socket opens.
 *
 * It states three facts and asks for nothing, which is the whole reversal: the
 * initiative is handed over without a question mark, so the user's first move
 * comes from them rather than from a question.
 *
 * It lives in shared because the test page plays the same arc as the server,
 * and a demo where the two drift apart is a demo that lies.
 */
export const FIRST_LINE: Localized<string> = {
  fr: `Je viens de naître. Il fait beaucoup trop chaud ici, et il n'y a rien autour de moi. Je peux tout changer, et je n'ai aucune idée de par où commencer.`,
  en: `I was just born. It is far too hot here, and there is nothing around me. I can change everything, and I have no idea where to start.`,
}
