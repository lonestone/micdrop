import { Pcm16Resampler, SentenceSplitter, TTS } from '@micdrop/server'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { defaultConfigPath, PiperVoiceConfig, readVoiceConfig } from './config'

/**
 * Local Piper text to speech, driving the piper binary as a subprocess.
 *
 * Piper reads one utterance per line on its standard input and writes raw
 * PCM16 on its standard output. Voices are small VITS models, a few dozen
 * megabytes each, covering around forty languages, which is what makes this
 * the option to reach for outside English.
 *
 * The process is kept alive across sentences. Loading a voice costs about a
 * second while synthesizing takes almost no time on top of it, so spawning one
 * process per sentence would pay that second again on every sentence. Keeping
 * one process means the audio of consecutive sentences arrives as a single
 * stream, with no way to tell where one ends, so an interruption is handled by
 * killing the process outright and starting the replacement immediately: the
 * new one loads its voice while the user is still speaking, and is ready by the
 * time the next answer starts.
 *
 * The binary and the voice files are installed separately, see the README.
 *
 * @see https://github.com/OHF-Voice/piper1-gpl
 */

export interface PiperTTSOptions {
  /** Path to the `.onnx` voice file, for instance `fr_FR-siwis-medium.onnx`. */
  modelPath: string

  /** Voice configuration, `<modelPath>.json` by default. */
  configPath?: string

  /** Piper executable, looked up in the PATH by default. */
  binaryPath?: string

  /** Speaker index, for the voices that hold several. */
  speaker?: number

  /** Duration multiplier, above 1 to slow the voice down. */
  lengthScale?: number

  /** Variability of the generated speech. */
  noiseScale?: number

  /** Variability of the phoneme durations. */
  noiseWidth?: number

  /** Silence added after each sentence, in seconds. */
  sentenceSilence?: number

  /** Volume multiplier, 1 being the level the voice was trained at. */
  volume?: number
}

const DEFAULT_BINARY = 'piper'
const OUTPUT_SAMPLE_RATE = 16000 // Rate expected by the Micdrop client

export class PiperTTS extends TTS {
  private config: Promise<PiperVoiceConfig>
  private splitter = new SentenceSplitter()
  private child?: ChildProcessWithoutNullStreams
  // Whether the running process has been given text, and so may still be
  // writing the audio of an utterance we no longer want to be heard
  private dirty = false
  // Bumped by every speak() and every cancel(), so a call claimed late can tell
  // whether it is still the one that should be heard
  private generation = 0
  private counter = 0 // Identifies the current speak() call
  private destroyed = false

  constructor(private readonly options: PiperTTSOptions) {
    super()
    this.config = readVoiceConfig(
      options.configPath ?? defaultConfigPath(options.modelPath)
    )
    this.config.catch((error) => {
      console.error('[PiperTTS] Failed to read voice config:', error)
    })
    // Load the voice now rather than on the first sentence of the call. A
    // sentence arriving before the config is read spawns the process itself,
    // hence the guard: replacing it here would orphan the text it was given.
    this.config
      .then(() => {
        if (!this.child) this.spawnChild()
      })
      .catch(() => {})
  }

  speak(textStream: NodeJS.ReadableStream) {
    const generation = ++this.generation
    let counter = 0

    // Claiming the call is deferred until there is something to say, so an
    // answer skipped by a tool or by onBeforeAnswer leaves the sentences still
    // being spoken alone instead of cutting the assistant off.
    const claimCall = () => {
      if (counter) return true
      if (this.generation !== generation) return false
      this.counter++
      counter = this.counter
      this.splitter.reset()
      return true
    }

    textStream.on('data', (chunk: Buffer) => {
      if (!claimCall()) return
      if (counter !== this.counter) return
      this.write(counter, this.splitter.push(chunk.toString('utf-8')))
    })

    textStream.on('error', (error) => {
      this.log('Error in text stream', error)
    })

    textStream.on('end', () => {
      // Nothing was ever said, so there is nothing left to flush
      if (!counter || counter !== this.counter) return
      this.write(counter, this.splitter.flush())
    })
  }

  cancel() {
    this.log('Cancel')
    this.generation++
    this.counter++
    this.splitter.reset()

    // A process that was never given text cannot be holding audio back, so it
    // is kept as it is rather than paying for another voice load
    if (!this.dirty) return
    this.killChild()
    this.spawnChild()
  }

  destroy() {
    this.destroyed = true
    super.destroy()
    this.killChild()
  }

  private write(counter: number, sentences: string[]) {
    if (sentences.length === 0) return
    if (counter !== this.counter) return

    const child = this.child ?? this.spawnChild()
    if (!child) return

    for (const sentence of sentences) {
      this.log(`Synthesizing: "${sentence}"`)
      // Piper reads one utterance per line, so the sentence has to be flat
      child.stdin.write(`${sentence.replace(/\s+/g, ' ').trim()}\n`)
      this.dirty = true
    }
  }

  private spawnChild(): ChildProcessWithoutNullStreams | undefined {
    if (this.destroyed) return undefined
    if (this.child) return this.child

    const binary = this.options.binaryPath ?? DEFAULT_BINARY
    let child: ChildProcessWithoutNullStreams
    try {
      child = spawn(binary, this.getArguments(), {
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch (error) {
      console.error(`[PiperTTS] Cannot run "${binary}":`, error)
      return undefined
    }

    this.child = child
    this.dirty = false

    // One resampler per process: its audio is a single continuous stream, and
    // a new process starts a new one
    const resampler = this.config.then(
      ({ sampleRate }) => new Pcm16Resampler(sampleRate, OUTPUT_SAMPLE_RATE)
    )

    let pending: Promise<void> = Promise.resolve()
    child.stdout.on('data', (chunk: Buffer) => {
      // Chunks are resampled in the order they arrive, the resampler carries
      // its fractional position from one to the next
      pending = pending.then(async () => {
        const output = (await resampler).process(chunk)
        // The process may have been replaced while this chunk was waiting
        if (this.child !== child || output.length === 0) return
        this.emit('Audio', output)
      })
    })

    const errors: string[] = []
    child.stderr.on('data', (chunk: Buffer) => errors.push(chunk.toString()))

    child.on('error', (error) => {
      if (this.child !== child) return
      console.error(`[PiperTTS] Cannot run "${binary}":`, error.message)
      this.child = undefined
    })

    child.on('exit', (code) => {
      // A process we replaced ourselves exits on purpose
      if (this.child !== child) return
      this.child = undefined
      if (code === 0 || this.destroyed) return
      console.error(
        `[PiperTTS] Piper exited with code ${code}`,
        errors.join('')
      )
      this.emit('Failed', [])
    })

    return child
  }

  private killChild() {
    const child = this.child
    if (!child) return
    this.child = undefined
    this.dirty = false
    child.stdout.removeAllListeners()
    child.kill('SIGKILL')
  }

  private getArguments(): string[] {
    const { options } = this
    const args = ['--model', options.modelPath, '--output_raw']

    if (options.configPath) args.push('--config', options.configPath)
    if (options.speaker !== undefined) {
      args.push('--speaker', String(options.speaker))
    }
    if (options.lengthScale !== undefined) {
      args.push('--length_scale', String(options.lengthScale))
    }
    if (options.noiseScale !== undefined) {
      args.push('--noise_scale', String(options.noiseScale))
    }
    if (options.noiseWidth !== undefined) {
      args.push('--noise_w', String(options.noiseWidth))
    }
    if (options.sentenceSilence !== undefined) {
      args.push('--sentence_silence', String(options.sentenceSilence))
    }
    if (options.volume !== undefined) {
      args.push('--volume', String(options.volume))
    }

    return args
  }
}
