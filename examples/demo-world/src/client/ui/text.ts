import { Localized } from '../../shared/lang'

/**
 * Every word the interface says on its own.
 *
 * She teaches her own vocabulary by using it, so there is very little here: a
 * handful of labels for the gauges, the one hint the gesture ever gives, and
 * the start screen. Anything longer than a few words belongs in her voice.
 */
export const TEXT: Localized<{
  title: string
  play: string
  connecting: string
  playAria: string
  pickAria: string
  flag: string
  age: string
  turns: string
  zeal: string
  scripture: string
  carved: string
  sensed: Record<string, string>
  doing: (what: string) => string
  interrupt: string
  stoppedInTime: string
  everythingAtOnce: string
  and: string
  below: string
  myNameIs: string
  copyLink: string
  copyLinkAria: string
  /** One short verb phrase per field and per direction, in her voice. */
  gestures: Record<string, { up: string; down: string }>
}> = {
  fr: {
    title: 'DOMPTEZ VOTRE PLANÈTE',
    play: 'jouer',
    connecting: 'connexion',
    playAria: 'Jouer',
    pickAria: 'Jouer en français',
    flag: '🇫🇷',
    age: 'âge',
    turns: 'tours',
    zeal: 'élan',
    scripture: 'ce qu’ils ont gravé',
    carved: 'Ils ont gravé une phrase',
    sensed: {
      heat: 'Tu sens ma chaleur',
      breath: 'Tu sens mon air',
      water: 'Tu sens mon eau',
      life: 'Tu sens ma vie',
    },
    doing: (what) => `Je ${what}`,
    interrupt: 'parle par-dessus moi pour m’arrêter',
    stoppedInTime: 'Tu m’as arrêtée à temps',
    everythingAtOnce: 'change tout en même temps',
    and: 'et',
    below: 'en bas',
    myNameIs: 'je m’appelle',
    copyLink: 'copier mon lien',
    copyLinkAria: 'Copier mon lien',
    gestures: {
      heat: { up: 'me réchauffe', down: 'me refroidis' },
      breath: { up: 'épaissis mon air', down: 'allège mon air' },
      water: { up: 'ajoute de l’eau', down: 'assèche tout' },
      roughness: { up: 'soulève le relief', down: 'aplanis tout' },
      vegetation: { up: 'fais pousser', down: 'arrache ce qui pousse' },
      creatures: { up: 'lâche des animaux', down: 'retire les animaux' },
      palette: { up: 'change mes couleurs', down: 'change mes couleurs' },
      moons: { up: 'ajoute des lunes', down: 'retire des lunes' },
      rings: { up: 'me mets des anneaux', down: 'retire mes anneaux' },
      auroras: { up: 'allume mes lumières', down: 'éteins mes lumières' },
    },
  },
  en: {
    title: 'TAME YOUR PLANET',
    play: 'play',
    connecting: 'connecting',
    playAria: 'Play',
    pickAria: 'Play in English',
    flag: '🇬🇧',
    age: 'age',
    turns: 'turns',
    zeal: 'momentum',
    scripture: 'what they carved',
    carved: 'They carved a sentence',
    sensed: {
      heat: 'You can feel my heat',
      breath: 'You can feel my air',
      water: 'You can feel my water',
      life: 'You can feel my life',
    },
    doing: (what) => `I ${what}`,
    interrupt: 'talk over me to stop me',
    stoppedInTime: 'You stopped me in time',
    everythingAtOnce: 'change everything at once',
    and: 'and',
    below: 'down there',
    myNameIs: 'my name is',
    copyLink: 'copy my link',
    copyLinkAria: 'Copy my link',
    gestures: {
      heat: { up: 'warm myself up', down: 'cool myself down' },
      breath: { up: 'thicken my air', down: 'thin my air' },
      water: { up: 'add water', down: 'dry everything out' },
      roughness: { up: 'raise the ground', down: 'flatten everything' },
      vegetation: { up: 'grow plants', down: 'tear the plants out' },
      creatures: { up: 'let animals loose', down: 'take the animals away' },
      palette: { up: 'change my colours', down: 'change my colours' },
      moons: { up: 'add moons', down: 'remove moons' },
      rings: { up: 'put my rings on', down: 'drop my rings' },
      auroras: { up: 'turn my lights on', down: 'turn my lights off' },
    },
  },
}
