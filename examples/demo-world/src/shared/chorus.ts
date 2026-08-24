import { Lang, Localized } from './lang'

/**
 * What the people do, reported by the only voice in the call.
 *
 * A civilisation with a microphone of its own would need a second synthesis and
 * a second latency budget, so it does not get one: she relays them, and the
 * interface renders the relay as theirs. Every line here is written in advance,
 * which means the whole civilisation speaks for the price of the audio and
 * never spends a generation.
 */

export type ChorusMoment =
  | 'arrival'
  | 'praise'
  | 'demand'
  | 'panic'
  | 'smog'
  | 'farewell'

export const CHORUS: Localized<Record<ChorusMoment, string[]>> = {
  fr: {
    arrival: [
      'Ils ont posé des lumières le long de mes rivages.',
      'Il y a des choses carrées en bas. Ce n’est pas moi qui les ai faites.',
    ],
    praise: [
      'Ils ont gravé une de tes phrases sur une pierre.',
      'Ils t’appellent le ciel. Ils se trompent, mais ils y tiennent.',
      'Ils répètent ton nom en montant sur les collines.',
    ],
    demand: [
      'Ils attendent un signe. Ils insistent.',
      'Ils se disputent sur le sens d’une de tes phrases. Il y a deux camps.',
      'Ils recopient tes mots partout. Ils en changent la moitié.',
    ],
    panic: [
      'Ils ont vu le ciel s’ouvrir. Ils pensent que c’est toi.',
      'Ils se cachent et ils répètent ta phrase à l’envers.',
    ],
    smog: [
      'Ils construisent plus vite que mon air ne se nettoie.',
      'Le ciel au-dessus de leurs villes est jaune. Ils ont écrit une chanson dessus.',
    ],
    farewell: [
      'Ils ont gravé ton nom sur une pierre qui tiendra plus longtemps qu’eux.',
      'Ils se sont tus, tous en même temps.',
    ],
  },
  en: {
    arrival: [
      'They put lights along my coasts.',
      'There are square things down there. I did not make those.',
    ],
    praise: [
      'They carved one of your sentences into a stone.',
      'They call you the sky. They are wrong, and they are very attached to it.',
      'They climb the hills repeating your name.',
    ],
    demand: [
      'They are waiting for a sign. They keep at it.',
      'They are arguing about what one of your sentences meant. There are two camps.',
      'They copy your words everywhere. Half of it comes out different.',
    ],
    panic: [
      'They saw the sky open. They think it was you.',
      'They are hiding and saying your sentence backwards.',
    ],
    smog: [
      'They build faster than my air clears.',
      'The sky above their cities is yellow. They wrote a song about it.',
    ],
    farewell: [
      'They carved your name into a stone that will outlast them.',
      'They went quiet, all at once.',
    ],
  },
}

export function pickChorus(
  lang: Lang,
  moment: ChorusMoment,
  avoid?: string
): string {
  const lines = CHORUS[lang][moment]
  const pool = lines.filter((line) => line !== avoid)
  const source = pool.length ? pool : lines
  return source[Math.floor(Math.random() * source.length)]
}
