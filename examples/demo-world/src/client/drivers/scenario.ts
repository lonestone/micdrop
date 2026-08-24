import { ShapeWorldInput } from '../../shared/tools'
import { FIRST_LINE } from '../../shared/script'
import { Status, worldStore } from '../store/WorldStore'
import { FakeChange } from './fakeServer'
import { playGesture, send } from './gesture'

export interface ScenarioStep {
  /** Seconds from the start of the run. */
  at: number
  label: string
  subtitle?: { text: string; from: 'planet' | 'user' | 'people' }
  status?: Status
  change?: FakeChange
  /** A full gesture, both halves, with or without somebody stopping it. */
  gesture?: { input: ShapeWorldInput; interruptAfter?: number }
}

/**
 * The whole arc, played without a microphone, a model or an API key.
 *
 * It exists so the five acts, the two halves of a gesture, the scripture, the
 * catastrophe and the ending can be watched end to end in a minute and a half,
 * which is the only sane way to work on timings, animations and copy.
 */
export const SCENARIO: ScenarioStep[] = [
  {
    at: 0,
    label: 'Acte 0, elle s’allume, et elle ne demande rien',
    status: 'speaking',
    subtitle: { text: FIRST_LINE.fr, from: 'planet' },
  },
  {
    at: 5,
    label: 'La première phrase',
    status: 'listening',
    subtitle: { text: 'Mets de l’eau, il faudrait de l’eau.', from: 'user' },
  },
  { at: 7, label: 'Elle réfléchit', status: 'thinking' },
  {
    at: 8,
    label: 'Le geste part, et il continue tout seul',
    status: 'speaking',
    subtitle: {
      text: 'De l’eau. Tout de suite. Regarde ça.',
      from: 'planet',
    },
    gesture: { input: { water: 'much_more', palette: 'ocean' } },
  },
  {
    at: 14,
    label: 'La démesure a atterri, elle est noyée',
    status: 'speaking',
    subtitle: {
      text: 'Voilà. Il y a de l’eau partout. Tu n’avais pas dit combien.',
      from: 'planet',
    },
    change: { look: 'surface' },
  },
  {
    at: 20,
    label: 'On la corrige, et on la coupe en plein élan',
    status: 'listening',
    subtitle: { text: 'Non, non, moins d’eau, arrête !', from: 'user' },
    change: { look: 'whole' },
    gesture: { input: { water: 'less', breath: 'more' }, interruptAfter: 2.4 },
  },
  {
    at: 25,
    label: 'Vexée, une seconde',
    status: 'speaking',
    subtitle: {
      text: 'J’allais en mettre beaucoup plus. Bon.',
      from: 'planet',
    },
    change: { look: 'whole' },
  },
  {
    at: 31,
    label: 'La chaleur redescend, les jauges apparaissent',
    status: 'speaking',
    subtitle: {
      text: 'Il fait moins chaud. C’est mieux.',
      from: 'planet',
    },
    change: { world: { heat: 0.52, breath: 0.5, water: 0.55 } },
  },
  {
    at: 38,
    label: 'Acte 2, quelque chose pousse',
    status: 'speaking',
    subtitle: {
      text: 'Il y a du vert, en bas. C’est moi qui ai fait ça.',
      from: 'planet',
    },
    change: {
      world: { life: 0.55, vegetation: 0.05, creatures: 0.05 },
      look: 'surface',
    },
  },
  {
    at: 44,
    label: 'Le vert se répand, les troupeaux arrivent',
    status: 'speaking',
    change: { world: { vegetation: 0.62, creatures: 0.5 }, look: 'whole' },
  },
  {
    at: 50,
    label: 'Elle retient le prénom',
    status: 'listening',
    subtitle: { text: 'Je m’appelle Godefroy.', from: 'user' },
    change: { userName: 'Godefroy' },
  },
  {
    at: 55,
    label: 'Acte 3, ils allument des lumières',
    status: 'speaking',
    subtitle: {
      text: 'Ils ont posé des lumières le long de mes rivages. Elles clignotent quand je tourne.',
      from: 'people',
    },
    change: { world: { cities: 0.3 }, look: 'night' },
  },
  {
    at: 62,
    label: 'Ils gravent une phrase, de travers',
    status: 'speaking',
    subtitle: {
      text: 'Il faudrait de l’eau',
      from: 'people',
    },
    change: { commandment: 'Il faudrait de l’eau' },
  },
  {
    at: 69,
    label: 'Deuxième pierre',
    status: 'speaking',
    subtitle: { text: 'NON NON ARRÊTE', from: 'people' },
    change: { commandment: 'NON NON ARRÊTE', look: 'far' },
  },
  {
    at: 76,
    label: 'Acte 4, le châtiment qui n’en est pas un',
    status: 'speaking',
    subtitle: {
      text: 'Ils ont vu le ciel s’ouvrir. Ils pensent que c’est toi qui es en colère.',
      from: 'people',
    },
    change: { event: 'meteor', look: 'far' },
  },
  {
    at: 83,
    label: 'Elle constate, elle ne demande rien',
    status: 'speaking',
    subtitle: {
      text: 'Je ne contrôle plus rien. Ils croient que c’est toi.',
      from: 'planet',
    },
  },
  {
    at: 89,
    label: 'Le sauvetage, tout revient dans les clous',
    status: 'speaking',
    subtitle: { text: 'Tu es resté. L’air revient.', from: 'planet' },
    change: {
      world: { heat: 0.5, breath: 0.52, water: 0.55, life: 0.8, cities: 0.45 },
      phase: 'legacy',
      look: 'whole',
    },
  },
  {
    at: 96,
    label: 'Acte 5, elle demande un nom',
    status: 'speaking',
    subtitle: { text: 'Il me faudrait un nom.', from: 'planet' },
    change: { look: 'far' },
  },
  {
    at: 102,
    label: 'Elle reçoit son nom, ils le gravent',
    status: 'speaking',
    subtitle: { text: 'Merci. Je vais tourner longtemps.', from: 'planet' },
    change: {
      planetName: 'Rien-du-Tout',
      commandment: 'Elle s’appelle rien-du-tout',
    },
  },
  { at: 109, label: 'Fin', status: 'offline' },
]

/** Plays the arc against the store. Returns the function that stops it. */
export function playScenario(
  onStep?: (step: ScenarioStep, index: number) => void
): () => void {
  worldStore.reset()
  const cleanups: Array<() => void> = []

  const timers = SCENARIO.map((step, index) =>
    setTimeout(() => {
      if (step.status) worldStore.setStatus(step.status)
      if (step.subtitle) worldStore.setSubtitle(step.subtitle)
      if (step.change) send(step.change)
      if (step.gesture) {
        cleanups.push(
          playGesture(step.gesture.input, {
            interruptAfter: step.gesture.interruptAfter,
          })
        )
      }
      onStep?.(step, index)
    }, step.at * 1000)
  )

  return () => {
    timers.forEach(clearTimeout)
    cleanups.forEach((stop) => stop())
  }
}
