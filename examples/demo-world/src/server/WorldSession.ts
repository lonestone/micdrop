import {
  Agent,
  MicdropConversationItem,
  MicdropServer,
  MicdropServerCommands,
} from '@micdrop/server'
import { ChorusMoment, pickChorus } from '../shared/chorus'
import { Lang } from '../shared/lang'
import {
  INITIAL_PROGRESS,
  Progress,
  SCRIPTURE_LENGTH,
} from '../shared/indicators'
import { Need, dominantNeed, pickLine } from '../shared/needs'
import { advanceProgress, phaseRank } from '../shared/progress'
import {
  CameraTarget,
  SCENE_EVENTS,
  SURGE_CHARGE,
  SURGE_RELEASE,
  SceneEvent,
  SceneEventId,
  Surge,
  SurgeField,
  WorldUpdate,
  applyEventImpact,
} from '../shared/protocol'
import { createSimulator } from '../shared/simulate'
import {
  ShapeWorldInput,
  TOOL_COMMANDMENT,
  TOOL_EVENT,
  TOOL_LOOK,
  TOOL_NAME,
  TOOL_REMEMBER,
  TOOL_SHAPE,
  applyOvershoot,
  applyShape,
  carveCommandmentSchema,
  lookAtSchema,
  namePlanetSchema,
  rememberNameSchema,
  shapeFields,
  shapeWorldSchema,
  surgeFields,
  triggerEventSchema,
} from '../shared/tools'
import { INITIAL_WORLD, WorldState, clamp, isAtPeace } from '../shared/world'
import { DirectionInput, buildDirection, toolDescription } from './prompt'

/**
 * Seconds of real silence before each rung of the ladder, counted afresh from
 * the last thing anyone said.
 *
 * They are long on purpose. She states a symptom and stops, so the silence
 * afterwards is where the user decides what to do about it; a planet that fills
 * that silence after twenty seconds is a planet talking over somebody thinking.
 */
const IDLE_THOUGHT = 45
const IDLE_NEED = 70
const IDLE_SPEAK = 100

/** Seconds between two things the people do, once they exist. */
const CHORUS_EVERY = 60

/** How long the third act runs before something arrives on its own. */
const WORSHIP_PATIENCE = 150

/**
 * Her voice reaches the browser long before it is heard: the synthesis streams
 * far faster than real time, so the server can be done sending while the
 * speaker still has ten seconds of her left to play.
 *
 * The only way to know when she actually stops being heard is to count what
 * went out. The TTS emits sixteen kilohertz, sixteen bit, mono, which is
 * thirty-two thousand bytes for every second that will be heard.
 */
const AUDIO_BYTES_PER_SECOND = 32000

/** Margin after her last syllable, for the network and the browser's buffer. */
const SPEECH_TAIL = 2

/**
 * How long a beat that arrived mid-sentence keeps trying to be said.
 *
 * Past that it is stale, and the queued beat is played by whatever answer comes
 * next instead.
 */
const DEFERRED_ANSWER_WINDOW = 20

/**
 * How long after the last chunk of user audio a cancellation still counts as
 * somebody talking over her.
 *
 * MicdropServer cancels whatever is in flight before every answer it starts,
 * which is right when the user takes the floor and wrong when a second
 * transcript lands for a turn she is already answering: closing the synthesis
 * socket cuts her sentence off mid-word.
 */
const BARGE_IN_GRACE = 1

/** A generation that never settles must not keep her quiet for the whole call. */
const ANSWER_TIMEOUT = 25

/**
 * How much of the user's voice it takes to call off a gesture.
 *
 * One chunk is a chair creaking. A handful is somebody saying stop, which is
 * the only input this mechanic ever needs and the reason it needs no tutorial.
 */
const BARGE_IN_CHUNKS = 3

/**
 * Everything the arc needs to know, kept on the server rather than in the
 * model's memory.
 *
 * It owns the authoritative world, answers the six tools, directs every answer
 * and fills the silences. It can also push a world update on its own by
 * emitting a ToolCall on the agent, which MicdropServer forwards to the browser
 * verbatim, so a planet that lurches on its own reaches the scene without a
 * round trip through the model.
 */
export class WorldSession {
  private base: WorldState = INITIAL_WORLD
  private baseAt = Date.now()
  private progress: Progress = { ...INITIAL_PROGRESS }
  private simulator = createSimulator()

  /** The half of a gesture that has not happened yet. */
  private pending?: {
    input: ShapeWorldInput
    /** Names alone, for the stage direction. */
    fields: string[]
    /** The same names with their direction, for what the interface says. */
    surge: SurgeField[]
  }
  private surgeTimer?: NodeJS.Timeout
  private bargeChunks = 0

  private crisisTriggered = false
  private crisisSurvived = false
  private nameAsked = false
  private farewellSaid = false
  private lastRites = false
  private answersInWorship = 0
  private worshipSince = 0
  private seenPhases = new Set<string>()
  private lastChorusAt = 0
  private lastChorusLine?: string

  private idleStage = 0
  /** The instant silence started counting from. */
  private silenceFrom = Date.now()
  private answering = false
  private answeringSince = 0
  /** When the browser will have finished playing what was sent to it. */
  private speakingUntil = 0
  /** The last time the user's microphone sent anything. */
  private lastUserAudioAt = 0
  /** Deadline for a beat that wanted the floor while she was still talking. */
  private deferredAnswerUntil = 0
  private idleTimer?: NodeJS.Timeout
  private tickTimer?: NodeJS.Timeout
  private lastLine?: string
  private lastTickWorld: WorldState = INITIAL_WORLD
  private directionSlot?: object
  private stopped = false

  private pendingBeat?: DirectionInput['beat']
  private pendingFields?: string[]

  constructor(
    private server: MicdropServer,
    private agent: Agent,
    private lang: Lang
  ) {}

  // ---------------------------------------------------------------- lifecycle

  private log(message: string) {
    this.agent.logger?.log(message)
  }

  start() {
    this.registerTools()
    this.guardTheFloor()
    this.server.on('UserAudio', this.onUserAudio)
    this.server.on('AssistantAudio', this.onAssistantAudio)
    this.server.on('End', this.stop)
    this.agent.on('Message', this.onAgentMessage)
    this.agent.on('SkipAnswer', this.onAnswerSettled)
    this.agent.on('Failed', this.onAnswerSettled)
    this.tickTimer = setInterval(this.tick, 500)
    this.idleTimer = setInterval(this.checkIdle, 1000)
  }

  /**
   * Everything that could take the floor away from her goes through here.
   *
   * MicdropServer answers on its own for every final transcript, and cancels
   * whatever is in flight just before. One spoken turn that comes back as two
   * transcripts therefore cuts her sentence in half and starts a second one,
   * and neither of those two calls is made from this file. Wrapping them is the
   * only place the demo can tell the two situations apart.
   *
   * Both refusals happen here rather than in the beforeAnswer hook, because a
   * generation skipped from the hook still runs the synthesis on an empty
   * stream: every call to speak() stamps a new request id, and the TTS then
   * drops the audio of the utterance still playing. Refusing late cuts her off
   * exactly like the double answer it was meant to prevent.
   */
  private guardTheFloor() {
    /** She has audio left to be heard and nobody has taken the floor. */
    const holdsTheFloor = () =>
      Date.now() < this.speakingUntil &&
      Date.now() - this.lastUserAudioAt > BARGE_IN_GRACE * 1000

    const answer = this.server.answer.bind(this.server)
    this.server.answer = () => {
      // The hook loses the stack in a promise chain, so this is the only place
      // whoever asked for a generation can be named.
      if (this.agent.logger) this.log(`Answer requested by ${callSite()}`)
      if (holdsTheFloor()) {
        this.log('Refusing a second answer, she is still being heard')
        this.server.socket?.send(MicdropServerCommands.SkipAnswer)
        return
      }
      answer()
    }

    const cancel = this.server.cancel.bind(this.server)
    this.server.cancel = () => {
      // Somebody talking over her is exactly what cancelling is for. A
      // cancellation with no voice behind it, while she is still being heard,
      // is the second half of a turn she has already started answering.
      if (holdsTheFloor()) {
        this.log('Refusing to cut her off, nobody talked over her')
        return
      }
      cancel()
    }
  }

  stop = () => {
    if (this.stopped) return
    this.stopped = true
    if (this.idleTimer) clearInterval(this.idleTimer)
    if (this.tickTimer) clearInterval(this.tickTimer)
    if (this.surgeTimer) clearTimeout(this.surgeTimer)
    this.server.off('UserAudio', this.onUserAudio)
    this.server.off('AssistantAudio', this.onAssistantAudio)
    this.agent.off('Message', this.onAgentMessage)
    this.agent.off('SkipAnswer', this.onAnswerSettled)
    this.agent.off('Failed', this.onAnswerSettled)
  }

  // -------------------------------------------------------------------- world

  /** The world as it stands right now, base state plus elapsed simulation. */
  get world(): WorldState {
    return this.simulator(this.base, (Date.now() - this.baseAt) / 1000)
  }

  get need(): Need {
    return dominantNeed(this.world)
  }

  private setBase(next: WorldState) {
    this.base = round(next)
    this.baseAt = Date.now()
    this.simulator = createSimulator()
  }

  /**
   * Applies a change, moves the progression forward and builds the payload the
   * browser receives. Numbers are rounded so both sides simulate from exactly
   * the same base.
   */
  private commit(
    next: WorldState,
    extra: {
      event?: SceneEvent
      look?: CameraTarget
      surge?: Surge
      chorus?: string
    } = {}
  ): WorldUpdate {
    const previous = this.world
    this.setBase(next)

    const result = advanceProgress({
      previousWorld: previous,
      world: this.base,
      progress: this.progress,
      crisisSurvived: this.crisisSurvived,
    })
    this.progress = result.progress

    return {
      world: this.base,
      progress: this.progress,
      unlocked: result.unlocked,
      achievements: result.achievements,
      feeling: this.need.hint,
      ...extra,
    }
  }

  /**
   * Sends a world update to the browser without asking the model for anything.
   * MicdropServer relays agent ToolCall events straight to the socket.
   */
  private push(update: WorldUpdate, name = 'world_update') {
    this.agent.emit('ToolCall', { name, parameters: {}, output: update })
  }

  // -------------------------------------------------------------------- tools

  private registerTools() {
    this.agent.addTool({
      name: TOOL_SHAPE,
      description: toolDescription('shape'),
      inputSchema: shapeWorldSchema,
      emitOutput: true,
      execute: (input) => this.shape(input),
    })

    this.agent.addTool({
      name: TOOL_LOOK,
      description: toolDescription('look'),
      inputSchema: lookAtSchema,
      emitOutput: true,
      execute: ({ target }) => this.commit(this.world, { look: target }),
    })

    this.agent.addTool({
      name: TOOL_EVENT,
      description: toolDescription('event'),
      inputSchema: triggerEventSchema,
      emitOutput: true,
      execute: ({ event }) => this.applyEvent(event as SceneEventId),
    })

    this.agent.addTool({
      name: TOOL_REMEMBER,
      description: toolDescription('remember'),
      inputSchema: rememberNameSchema,
      emitOutput: true,
      execute: ({ name }) => {
        this.progress = { ...this.progress, userName: name.trim() }
        return this.commit(this.world)
      },
    })

    this.agent.addTool({
      name: TOOL_NAME,
      description: toolDescription('name'),
      inputSchema: namePlanetSchema,
      emitOutput: true,
      execute: ({ name }) => {
        this.progress = { ...this.progress, planetName: name.trim() }
        return this.commit(this.world)
      },
    })

    this.agent.addTool({
      name: TOOL_COMMANDMENT,
      description: toolDescription('commandment'),
      inputSchema: carveCommandmentSchema,
      emitOutput: true,
      execute: ({ text }) => this.carve(text),
    })
  }

  // ------------------------------------------------------------------ gesture

  /**
   * A gesture happens in two halves. The first lands now, and the browser is
   * told that the second one is coming, which is the only warning the mechanic
   * ever gives and the only one it needs.
   */
  private shape(input: ShapeWorldInput): WorldUpdate {
    const fields = shapeFields(input)
    const world = applyShape(this.world, input)

    if (!fields.length) return this.commit(world)

    const surge = surgeFields(this.world, input)

    this.clearSurge()
    this.pending = { input, fields, surge }
    this.bargeChunks = 0
    this.surgeTimer = setTimeout(this.release, SURGE_CHARGE * 1000)

    return this.commit(world, {
      surge: { kind: 'charging', duration: SURGE_CHARGE, fields: surge },
    })
  }

  private clearSurge() {
    if (this.surgeTimer) clearTimeout(this.surgeTimer)
    this.surgeTimer = undefined
    this.pending = undefined
  }

  /** Nobody said anything, so she finishes what she had started. */
  private release = () => {
    const pending = this.pending
    this.clearSurge()
    if (!pending || this.stopped) return

    const world = this.world
    const next = applyOvershoot(world, pending.input)

    this.progress = {
      ...this.progress,
      overshoots: this.progress.overshoots + 1,
    }
    this.queueBeat('too_much', pending.fields)

    this.push(
      this.commit(next, {
        surge: {
          kind: 'overshoot',
          duration: SURGE_RELEASE,
          fields: pending.surge,
        },
      })
    )

    // She comments on the damage herself, immediately. The queue in
    // MicdropServer holds this behind whatever she is still saying, so the two
    // halves of the gesture arrive as two beats rather than as one collision.
    if (!this.stopped) this.server.answer()
  }

  /** Somebody spoke over her, and the second half never happens. */
  private cancelSurge() {
    const pending = this.pending
    if (!pending) return
    this.clearSurge()

    const world = this.world
    this.progress = {
      ...this.progress,
      interruptions: this.progress.interruptions + 1,
    }
    this.queueBeat('stopped', pending.fields)

    this.push(
      this.commit(world, {
        surge: { kind: 'stopped', duration: 1.6, fields: pending.surge },
      })
    )
  }

  private queueBeat(beat: DirectionInput['beat'], fields?: string[]) {
    this.pendingBeat = beat
    this.pendingFields = fields
  }

  private carve(text: string): WorldUpdate {
    const carved = text.trim().replace(/\s+/g, ' ').slice(0, 90)
    if (!carved || this.progress.commandments.includes(carved)) {
      return this.commit(this.world)
    }
    this.progress = {
      ...this.progress,
      commandments: [...this.progress.commandments, carved],
    }
    return this.commit(this.world, { look: 'night' })
  }

  private applyEvent(id: SceneEventId): WorldUpdate {
    const event = SCENE_EVENTS[id]
    const world = applyEventImpact(this.world, id)
    this.crisisTriggered = true
    return this.commit(world, { event, look: 'far' })
  }

  // ------------------------------------------------------------------ answers

  /**
   * Called before every generation. Replaces the single stage direction sitting
   * at the end of the conversation, so the model always plays the right beat
   * without the conversation growing a new system message each turn.
   *
   * Refusing an answer does not belong here, see guardTheFloor: by the time the
   * hook runs, the synthesis of the previous sentence is already lost.
   */
  beforeAnswer(): boolean | void {
    if (this.stopped) return true

    this.answering = true
    this.answeringSince = Date.now()
    this.silenceFrom = Date.now()

    const world = this.world
    const firstOfPhase = !this.seenPhases.has(this.progress.phase)
    this.seenPhases.add(this.progress.phase)
    if (this.progress.phase === 'worship') this.answersInWorship++

    const beat = this.nextBeat()
    const fields = this.pendingFields
    this.pendingFields = undefined

    this.setDirection({
      world,
      progress: this.progress,
      need: dominantNeed(world),
      firstOfPhase,
      beat,
      fields,
    })
  }

  /** Marks the direction consumed for one-off beats, and picks the next one. */
  private nextBeat(): DirectionInput['beat'] {
    if (this.pendingBeat) {
      const beat = this.pendingBeat
      this.pendingBeat = undefined
      return beat
    }

    if (this.progress.phase === 'legacy') {
      if (this.progress.planetName && !this.farewellSaid) {
        this.farewellSaid = true
        return 'farewell'
      }
      if (
        !this.lastRites &&
        this.progress.commandments.length < SCRIPTURE_LENGTH
      ) {
        this.lastRites = true
        return 'commandment'
      }
      if (!this.nameAsked) {
        this.nameAsked = true
        return 'ask_name'
      }
      return undefined
    }

    if (this.progress.phase === 'worship') {
      // Two pieces of scripture during the worship act, spaced out, and the
      // third one is saved for the very end.
      const carved = this.progress.commandments.length
      if (
        carved < SCRIPTURE_LENGTH - 1 &&
        this.answersInWorship >= carved * 3 + 2
      ) {
        return 'commandment'
      }
    }

    return undefined
  }

  private setDirection(input: DirectionInput) {
    const conversation = this.agent.conversation
    if (this.directionSlot) {
      const index = conversation.indexOf(this.directionSlot as any)
      if (index !== -1) conversation.splice(index, 1)
    }
    const message = {
      role: 'system' as const,
      content: buildDirection(input),
    }

    // The direction goes just before the last user message rather than after
    // it. MicdropServer refuses to answer the same last message twice, and a
    // system message appended past it defeats that guard: both the transcript
    // and the end of the user's turn then start a generation, and the second
    // one cuts the first one off in the middle of a sentence.
    const last = conversation[conversation.length - 1]
    if (last && 'role' in last && last.role === 'user') {
      conversation.splice(conversation.length - 1, 0, message)
    } else {
      conversation.push(message)
    }
    this.directionSlot = message
  }

  // ------------------------------------------------------------------ silence

  private onUserAudio = () => {
    this.idleStage = 0
    this.silenceFrom = Date.now()
    this.lastUserAudioAt = Date.now()
    // Talking over her stops the playback in the browser, so whatever was left
    // of her is never heard and must not keep the floor busy.
    this.speakingUntil = 0
    if (!this.pending) return
    this.bargeChunks++
    if (this.bargeChunks >= BARGE_IN_CHUNKS) this.cancelSurge()
  }

  private onAssistantAudio = (chunk: Buffer) => {
    // Chunks arrive in bursts, so each one extends the end of the queue rather
    // than restarting it from now.
    const from = Math.max(Date.now(), this.speakingUntil)
    this.speakingUntil =
      from + (chunk.byteLength / AUDIO_BYTES_PER_SECOND) * 1000
    this.silenceFrom = this.speakingUntil + SPEECH_TAIL * 1000
  }

  private onAgentMessage = (item: MicdropConversationItem) => {
    if (item.role === 'user') {
      // A transcript means an answer is on its way. That is not silence.
      this.idleStage = 0
      this.silenceFrom = Date.now()
    } else if (item.role === 'assistant') {
      this.onAnswerSettled()
    }
  }

  private onAnswerSettled = () => {
    this.answering = false
    // The generation ends long before she does, so this never pulls the start
    // of the silence back in front of the audio still queued in the browser.
    this.silenceFrom = Math.max(this.silenceFrom, Date.now())
  }

  /**
   * True while she has the floor, which lasts well past the generation: the
   * audio is still playing in the browser long after the server sent it, and
   * starting a second answer there cuts her off mid-sentence.
   */
  private get busy(): boolean {
    if (Date.now() < this.speakingUntil) return true
    if (!this.answering) return false
    if (Date.now() - this.answeringSince > ANSWER_TIMEOUT * 1000) {
      this.answering = false
      return false
    }
    return true
  }

  /**
   * Checked once a second against a deadline rather than driven by a chain of
   * timers, so nothing can slip through between a transcript arriving and the
   * first syllable coming back.
   */
  private checkIdle = () => {
    if (this.stopped || !this.server.socket || this.busy) return
    if (Date.now() - this.silenceFrom < 6000) return

    if (this.speakChorus()) return

    const delay =
      this.idleStage === 0
        ? IDLE_THOUGHT
        : this.idleStage === 1
          ? IDLE_NEED
          : IDLE_SPEAK
    if (Date.now() - this.silenceFrom < delay * 1000) return
    this.speakIntoSilence()
  }

  /**
   * The people, on their own schedule and for the price of the audio: the line
   * is written in advance, so a whole civilisation living its life costs one
   * synthesis and not a single generation.
   */
  private speakChorus(): boolean {
    if (phaseRank(this.progress.phase) < phaseRank('worship')) return false
    if (Date.now() - this.lastChorusAt < CHORUS_EVERY * 1000) return false

    const world = this.world
    let moment: ChorusMoment = 'praise'
    if (this.crisisTriggered && !this.crisisSurvived) moment = 'panic'
    else if (world.breath > 0.66 && world.cities > 0.3) moment = 'smog'
    else if (this.progress.phase === 'legacy') moment = 'farewell'
    else if (this.progress.commandments.length) moment = 'demand'

    const line = pickChorus(this.lang, moment, this.lastChorusLine)
    this.lastChorusLine = line
    this.lastChorusAt = Date.now()
    this.silenceFrom = Date.now()

    this.push(this.commit(world, { chorus: line, look: 'night' }))
    this.agent.addAssistantMessage(line)
    this.server.speak(line)
    return true
  }

  /**
   * The ladder. The first two rungs cost no tokens at all: the code knows the
   * symptom, picks a written line and sends it straight to the voice.
   */
  private speakIntoSilence() {
    const need = this.need
    this.silenceFrom = Date.now()

    if (this.idleStage < 2) {
      const pool = this.idleStage === 0 ? need.thoughts : need.needs
      const line = pickLine(pool[this.lang], this.lastLine)
      this.lastLine = line
      this.idleStage++
      this.agent.addAssistantMessage(line)
      this.server.speak(line)
      return
    }

    // Third rung, and the only one that spends a generation: she cannot stand
    // having nothing to do, and she says so.
    this.push(
      this.commit({ ...this.world, breath: clamp(this.world.breath - 0.05) })
    )
    this.queueBeat('silence')
    this.idleStage = 0
    this.server.answer()
  }

  // --------------------------------------------------------------------- tick

  /** Server side bookkeeping, no tokens, no network unless something changes. */
  private tick = () => {
    if (this.stopped) return
    this.checkDeferredAnswer()
    const world = this.world
    const before = this.progress.phase

    const result = advanceProgress({
      previousWorld: this.lastTickWorld,
      world,
      progress: this.progress,
      crisisSurvived: this.crisisSurvived,
    })
    this.lastTickWorld = world
    if (result.changed) this.progress = result.progress

    // Each act announces itself once, through her, and the browser hears about
    // it in the same message.
    if (this.progress.phase !== before) {
      if (this.progress.phase === 'life') {
        this.queueBeat('first_life')
        this.push(this.commit(world, { look: 'surface' }))
        this.answerWhenQuiet()
        return
      }
      if (this.progress.phase === 'worship') {
        this.lastChorusAt = Date.now()
        this.worshipSince = Date.now()
        this.queueBeat('first_city')
        this.push(
          this.commit(world, {
            chorus: pickChorus(this.lang, 'arrival'),
            look: 'night',
          })
        )
        this.answerWhenQuiet()
        return
      }
    }

    // Once they have written twice, or once they have been at it long enough,
    // something arrives that they will read as an answer to what they wrote.
    // The clock is the safety net: a model that never carves anything must not
    // leave the third act without an ending.
    if (
      !this.crisisTriggered &&
      this.worshipSince > 0 &&
      (this.progress.commandments.length >= SCRIPTURE_LENGTH - 1 ||
        Date.now() - this.worshipSince > WORSHIP_PATIENCE * 1000)
    ) {
      this.startCrisis()
      return
    }

    if (this.crisisTriggered && !this.crisisSurvived && isAtPeace(world)) {
      this.crisisSurvived = true
      this.progress = { ...this.progress, phase: 'legacy' }
      this.push(this.commit(world, { look: 'far' }))
      return
    }

    // A world nobody ever broke still has to end: enough time in balance is
    // its own ending.
    if (
      !this.crisisTriggered &&
      world.age > 90 &&
      phaseRank(this.progress.phase) < phaseRank('legacy')
    ) {
      this.progress = { ...this.progress, phase: 'legacy' }
      this.push(this.commit(world, { look: 'far' }))
    }
  }

  /** The world breaks on its own, and the browser sees it before she speaks. */
  private startCrisis() {
    const candidates: SceneEventId[] = ['meteor', 'flare', 'eruption', 'freeze']
    const id = candidates[Math.floor(Math.random() * candidates.length)]
    this.queueBeat('crisis')
    this.lastChorusAt = Date.now()
    this.push(
      { ...this.applyEvent(id), chorus: pickChorus(this.lang, 'panic') },
      'trigger_event'
    )
    this.answerWhenQuiet()
  }

  /**
   * Speaks up, unless she is already speaking or the user is.
   *
   * Cutting her off in the middle of her own sentence is the one thing the demo
   * must never do to itself, so a beat that lands mid-sentence waits for the
   * floor rather than taking it.
   */
  private answerWhenQuiet() {
    if (this.stopped) return
    if (this.busy) {
      this.deferredAnswerUntil = Date.now() + DEFERRED_ANSWER_WINDOW * 1000
      return
    }
    this.deferredAnswerUntil = 0
    this.server.answer()
  }

  /** Gives a beat that had to wait its turn, once nobody else is talking. */
  private checkDeferredAnswer() {
    if (!this.deferredAnswerUntil) return
    if (Date.now() > this.deferredAnswerUntil) {
      this.deferredAnswerUntil = 0
      return
    }
    if (this.busy || Date.now() - this.silenceFrom < 1000) return
    this.deferredAnswerUntil = 0
    this.server.answer()
  }
}

/** The two frames above the patched answer(), for the debug log. */
function callSite(): string {
  return (new Error().stack ?? '')
    .split('\n')
    .slice(3, 5)
    .map((frame) => frame.trim().replace(/^at /, ''))
    .join(' < ')
}

/** Two decimals is plenty, and it keeps both simulations bit for bit equal. */
function round(world: WorldState): WorldState {
  const next = { ...world }
  for (const key of Object.keys(next) as (keyof WorldState)[]) {
    const value = next[key]
    if (typeof value === 'number' && key !== 'moons' && key !== 'seed') {
      ;(next as any)[key] = Math.round(value * 100) / 100
    }
  }
  return next
}
