import { Localized } from './lang'
import { COMFORT, strain, Vital, WorldState, isAtPeace, health } from './world'

/**
 * She never names a parameter, and she never names a metaphor either. She says
 * the flat fact: it is dry, it is far too hot, there is water everywhere.
 *
 * Nothing here asks for anything. A symptom stated plainly already contains
 * what to do about it, and a planet that spells the instruction out loud turns
 * a conversation into a form to fill in.
 *
 * Every line below is spoken through the TTS without asking the LLM for
 * anything, so she can talk during a silence for the price of the audio.
 */

export type NeedId =
  | 'burning'
  | 'freezing'
  | 'crushed'
  | 'smothered'
  | 'airless'
  | 'parched'
  | 'drowning'
  | 'barren'
  | 'lonely'
  | 'peace'

export interface Need {
  id: NeedId
  /** Which vital the gauge belongs to, so fixing it reveals the gauge. */
  vital: Vital
  /** Said out loud after a long silence. States, asks for nothing. */
  thoughts: Localized<string[]>
  /** Said out loud after a much longer one. The same fact, less patient. */
  needs: Localized<string[]>
  /**
   * Handed to the LLM so it voices the same symptom in its own words. It is
   * read and never heard, so it stays English like the rest of the prompt.
   */
  hint: string
}

export const NEEDS: Record<NeedId, Need> = {
  burning: {
    id: 'burning',
    vital: 'heat',
    thoughts: {
      fr: [
        'C’est chaud. Beaucoup trop chaud.',
        'J’ai de la roche liquide un peu partout.',
      ],
      en: [
        'It is hot. Far too hot.',
        'I have liquid rock in a lot of places.',
      ],
    },
    needs: {
      fr: [
        'Je brûle. Je ne vais pas tenir longtemps comme ça.',
        'Il fait bien trop chaud sur moi. Rien ne peut tenir à cette température.',
      ],
      en: [
        'I am burning. I will not last long like this.',
        'It is far too hot on me. Nothing survives at this temperature.',
      ],
    },
    hint: 'She is far too hot, the rock stays liquid in places.',
  },
  freezing: {
    id: 'freezing',
    vital: 'heat',
    thoughts: {
      fr: ['Tout est gelé. Tout.', 'J’ai froid, et le froid gagne du terrain.'],
      en: ['Everything is frozen. Everything.', 'I am cold, and the cold is gaining ground.'],
    },
    needs: {
      fr: [
        'Plus rien ne bouge à ma surface. C’est très propre et c’est très mort.',
        'Je suis glacée. Ça descend encore.',
      ],
      en: [
        'Nothing moves on my surface any more. It is very tidy and very dead.',
        'I am frozen through. It is still dropping.',
      ],
    },
    hint: 'She is freezing over, everything is seizing up.',
  },
  crushed: {
    id: 'crushed',
    vital: 'breath',
    thoughts: {
      fr: ['L’air est trop lourd. Il m’écrase.', 'Il y a trop d’air autour de moi.'],
      en: ['The air is too heavy. It is crushing me.', 'There is too much air around me.'],
    },
    needs: {
      fr: [
        'Il y a beaucoup trop d’air sur moi, et il pèse.',
        'Ça pèse sur moi et ça ne s’allège pas.',
      ],
      en: [
        'There is far too much air on me, and it is heavy.',
        'It weighs on me and it is not letting up.',
      ],
    },
    hint: 'Her atmosphere has grown far too thick, and it presses down on everything.',
  },
  smothered: {
    id: 'smothered',
    vital: 'breath',
    thoughts: {
      fr: [
        'Le ciel est jaune au-dessus de leurs villes.',
        'Ils construisent beaucoup, et mon air s’alourdit.',
      ],
      en: [
        'The sky above their cities is yellow.',
        'They build a lot, and my air gets heavier.',
      ],
    },
    needs: {
      fr: [
        'Ils ont épaissi mon air. Ils sont très fiers, et je ne vois plus le sol.',
        'Ce qu’ils fabriquent me remplit le ciel.',
      ],
      en: [
        'They thickened my air. They are very proud, and I cannot see the ground.',
        'What they make fills up my sky.',
      ],
    },
    hint: 'What the civilisation makes is thickening her atmosphere, and her own inhabitants are the cause of it.',
  },
  airless: {
    id: 'airless',
    vital: 'breath',
    thoughts: {
      fr: ['Il n’y a rien autour de moi. Rien du tout.', 'Le vide me touche directement.'],
      en: ['There is nothing around me. Nothing at all.', 'The vacuum touches me directly.'],
    },
    needs: {
      fr: [
        'Il n’y a pas un gramme d’air sur moi.',
        'Il n’y a rien entre moi et le noir.',
      ],
      en: [
        'There is not a gram of air on me.',
        'There is nothing between me and the dark.',
      ],
    },
    hint: 'She has almost no atmosphere, the vacuum sits right on her surface.',
  },
  parched: {
    id: 'parched',
    vital: 'water',
    thoughts: {
      fr: ['C’est sec. Beaucoup trop sec.', 'Il n’y a pas une goutte d’eau sur moi.'],
      en: ['It is dry. Far too dry.', 'There is not a drop of water on me.'],
    },
    needs: {
      fr: ['Tout est sec. Ça craque quand je tourne.', 'Mes bassins sont vides. Tous.'],
      en: ['Everything is dry. It cracks when I turn.', 'My basins are empty. All of them.'],
    },
    hint: 'She is short of water, her basins are empty.',
  },
  drowning: {
    id: 'drowning',
    vital: 'water',
    thoughts: {
      fr: ['Il y a de l’eau partout. Je ne vois plus mes montagnes.', 'J’ai trop d’eau.'],
      en: ['There is water everywhere. I cannot see my mountains any more.', 'I have too much water.'],
    },
    needs: {
      fr: [
        'L’eau a tout recouvert. Il ne me reste plus un rivage.',
        'Il y a beaucoup trop d’eau. J’en ai peut-être mis un peu plus que demandé.',
      ],
      en: [
        'The water covered everything. I have no shoreline left.',
        'There is far too much water. I may have added slightly more than asked.',
      ],
    },
    hint: 'She is entirely drowned, her land has vanished under the water.',
  },
  barren: {
    id: 'barren',
    vital: 'life',
    thoughts: {
      fr: [
        'Il ne se passe rien sur moi.',
        'J’ai beaucoup de place, et personne dessus.',
      ],
      en: [
        'Nothing is happening on me.',
        'I have a lot of room, and nobody on it.',
      ],
    },
    needs: {
      fr: [
        'Ma surface est vide, du premier caillou au dernier.',
        'Rien ne pousse ici, et ça commence à se voir.',
      ],
      en: [
        'My surface is empty, from the first rock to the last.',
        'Nothing grows here, and it is starting to show.',
      ],
    },
    hint: 'Nothing lives on her, even though the conditions would allow life.',
  },
  lonely: {
    id: 'lonely',
    vital: 'life',
    thoughts: {
      fr: [
        'Il y a du vert, mais rien qui marche dessus.',
        'Ce qui a poussé reste au même endroit.',
      ],
      en: [
        'There is green, but nothing walking on it.',
        'What grew stays exactly where it grew.',
      ],
    },
    needs: {
      fr: [
        'Rien ne se déplace sur moi. Il n’y a que des plantes.',
        'J’ai de la vie, mais elle ne va nulle part.',
      ],
      en: [
        'Nothing travels across me. There are only plants.',
        'I have life, and it goes nowhere.',
      ],
    },
    hint: 'There are plants but no animals, nothing travels across her.',
  },
  peace: {
    id: 'peace',
    vital: 'life',
    thoughts: {
      fr: [
        'Tout tient. C’est nouveau.',
        'Il y a un bruit, en bas, que je n’avais jamais entendu.',
        'Tu es toujours là.',
      ],
      en: [
        'Everything holds. That is new.',
        'There is a sound down there I had never heard before.',
        'You are still here.',
      ],
    },
    needs: {
      fr: ['Tout va bien. Je n’ai besoin de rien.', 'Je vieillis. Je crois que c’est ça, vieillir.'],
      en: ['Everything is fine. I need nothing.', 'I am ageing. I think this is what ageing is.'],
    },
    hint: 'Everything is in balance, she needs nothing and she is ageing gently.',
  },
}

export interface ActiveNeed {
  need: Need
  severity: number
}

/** Every symptom she currently feels, worst first. */
export function activeNeeds(state: WorldState): ActiveNeed[] {
  const list: ActiveNeed[] = []
  const push = (id: NeedId, severity: number) => {
    if (severity > 0.02) list.push({ need: NEEDS[id], severity })
  }

  push(state.heat > COMFORT.heat[1] ? 'burning' : 'freezing', strain(state, 'heat'))

  // Thick air is one symptom with two culprits, and which one it is changes
  // what she can do about it: she can thin her own sky, she cannot thin theirs.
  const thick = state.breath > COMFORT.breath[1]
  push(
    thick ? (state.cities > 0.25 ? 'smothered' : 'crushed') : 'airless',
    strain(state, 'breath')
  )

  push(
    state.water > COMFORT.water[1] ? 'drowning' : 'parched',
    strain(state, 'water')
  )
  if (state.life < COMFORT.life[0]) {
    push('barren', strain(state, 'life'))
  } else if (state.creatures < 0.15) {
    push('lonely', 0.2)
  }

  return list.sort((a, b) => b.severity - a.severity)
}

/** The one thing she would talk about if she could only say one. */
export function dominantNeed(state: WorldState): Need {
  if (isAtPeace(state) && health(state) > 0.9) return NEEDS.peace
  return activeNeeds(state)[0]?.need ?? NEEDS.peace
}

export function pickLine(lines: string[], avoid?: string): string {
  const pool = lines.filter((line) => line !== avoid)
  const source = pool.length ? pool : lines
  return source[Math.floor(Math.random() * source.length)]
}
