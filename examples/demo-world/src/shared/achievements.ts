import { Lang, Localized } from './lang'
import { WorldState } from './world'

/**
 * Never a quest log. They are named after the fact, so a mistake becomes a
 * memory instead of a failure, and nothing has to be planned in advance.
 */

export interface Achievement {
  id: string
  label: Localized<string>
  earned: (context: ProgressContext) => boolean
}

export interface ProgressContext {
  world: WorldState
  /** Seconds spent with every vital inside its band. */
  peaceSeconds: number
  crisisSurvived: boolean
  /** Gestures she was allowed to finish, and gestures she was cut off in. */
  overshoots: number
  interruptions: number
  commandments: number
  userName?: string
  planetName?: string
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-gesture',
    label: {
      fr: 'J’ai compris, à ma façon',
      en: 'I understood, in my own way',
    },
    earned: ({ overshoots, interruptions }) => overshoots + interruptions > 0,
  },
  {
    id: 'too-much',
    label: {
      fr: 'Oups, j’en ai fait un peu trop',
      en: 'Oops, I did a bit too much',
    },
    earned: ({ overshoots }) => overshoots >= 1,
  },
  {
    id: 'cut-off',
    label: {
      fr: 'Tu m’as coupée en plein élan',
      en: 'You cut me off mid-flight',
    },
    earned: ({ interruptions }) => interruptions >= 1,
  },
  {
    id: 'tamed',
    label: {
      fr: 'Je commence à me retenir',
      en: 'I am starting to hold back',
    },
    earned: ({ interruptions, overshoots }) =>
      interruptions >= 3 && interruptions > overshoots,
  },
  {
    id: 'unleashed',
    label: {
      fr: 'Tu m’as laissée faire',
      en: 'You let me run',
    },
    earned: ({ overshoots, interruptions }) =>
      overshoots >= 4 && interruptions === 0,
  },
  {
    id: 'something-grew',
    label: {
      fr: 'Quelque chose a poussé sur moi',
      en: 'Something grew on me',
    },
    earned: ({ world }) => world.vegetation > 0.25,
  },
  {
    id: 'it-moves',
    label: {
      fr: 'Quelque chose bouge tout seul',
      en: 'Something moves on its own',
    },
    earned: ({ world }) => world.creatures > 0.25,
  },
  {
    id: 'lights-on',
    label: {
      fr: 'Ils ont allumé des lumières',
      en: 'They turned the lights on',
    },
    earned: ({ world }) => world.cities > 0.15,
  },
  {
    id: 'misquoted',
    label: {
      fr: 'Ils t’ont mal compris',
      en: 'They got you wrong',
    },
    earned: ({ commandments }) => commandments >= 1,
  },
  {
    id: 'smog',
    label: {
      fr: 'Ils ont épaissi mon ciel',
      en: 'They thickened my sky',
    },
    earned: ({ world }) => world.cities > 0.4 && world.breath > 0.68,
  },
  {
    id: 'stayed',
    label: {
      fr: 'J’ai eu peur, et tu es resté',
      en: 'I was afraid, and you stayed',
    },
    earned: ({ crisisSurvived }) => crisisSurvived,
  },
  {
    id: 'she-slept',
    label: {
      fr: 'J’ai dormi',
      en: 'I slept',
    },
    earned: ({ peaceSeconds }) => peaceSeconds >= 20,
  },
  {
    id: 'knows-your-name',
    label: {
      fr: 'Je connais ton prénom',
      en: 'I know your first name',
    },
    earned: ({ userName }) => Boolean(userName),
  },
  {
    id: 'named',
    label: {
      fr: 'J’ai un nom',
      en: 'I have a name',
    },
    earned: ({ planetName }) => Boolean(planetName),
  },
]

export function newAchievements(
  earnedIds: string[],
  context: ProgressContext
): Achievement[] {
  return ACHIEVEMENTS.filter(
    (achievement) =>
      !earnedIds.includes(achievement.id) && achievement.earned(context)
  )
}

export function achievementLabel(id: string, lang: Lang): string {
  return (
    ACHIEVEMENTS.find((achievement) => achievement.id === id)?.label[lang] ?? id
  )
}
