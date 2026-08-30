import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { MicRecorder } from '../src/audio/MicRecorder'
import { pcm16ToFloat } from '../src/audio/pcm'
import { FakeMicSource, ManualVAD, silence, sine } from './fakes'

const CHUNK_SAMPLES = 1600 // 100 ms at 16 kHz

describe('MicRecorder', () => {
  let mic: FakeMicSource
  let vad: ManualVAD
  let recorder: MicRecorder
  let chunks: Int16Array[]
  let events: string[]

  beforeEach(async () => {
    mic = new FakeMicSource()
    vad = new ManualVAD()
    recorder = new MicRecorder(vad)
    chunks = []
    events = []
    recorder.on('Chunk', (chunk) => chunks.push(chunk))
    recorder.on('StartSpeaking', () => events.push('StartSpeaking'))
    recorder.on('StopSpeaking', () => events.push('StopSpeaking'))
    await recorder.start(mic)
  })

  /** Feeds `seconds` of audio in 10 ms frames, as a recorder would */
  function feed(seconds: number, loud: boolean, sampleRate = 16000) {
    const frameLength = Math.round(0.01 * sampleRate)
    const frames = Math.round((seconds * 1000) / 10)
    for (let i = 0; i < frames; i++) {
      const samples = loud
        ? sine(0.01, { amplitude: 0.4, sampleRate })
        : silence(0.01, sampleRate)
      mic.emit('Frames', samples, sampleRate)
      assert.equal(samples.length, frameLength)
    }
  }

  it('starts ready to record', () => {
    assert.equal(recorder.state.isStarted, true)
    assert.equal(recorder.state.isSpeaking, false)
  })

  it('sends nothing while nobody speaks', () => {
    feed(1, false)
    assert.equal(chunks.length, 0)
  })

  it('holds the chunks back until the speech is confirmed', () => {
    feed(0.5, false)
    vad.emit('StartSpeaking')
    feed(0.3, true)
    assert.equal(chunks.length, 0, 'nothing leaves before ConfirmSpeaking')

    vad.emit('ConfirmSpeaking')
    assert.deepEqual(events, ['StartSpeaking'])
    assert.ok(chunks.length > 0, 'the queued chunks are released at once')
  })

  it('keeps as much reserve as the VAD says it needs', async () => {
    // The reserve is what saves the first syllable: a VAD that takes 300 ms to
    // make up its mind needs 300 ms of audio kept behind it
    const slow = new ManualVAD()
    slow.delay = 300
    const slowRecorder = new MicRecorder(slow)
    const slowChunks: Int16Array[] = []
    slowRecorder.on('Chunk', (chunk) => slowChunks.push(chunk))
    await slowRecorder.start(mic)

    // A full second of speech nobody has noticed yet
    for (let i = 0; i < 100; i++) {
      mic.emit('Frames', sine(0.01, { amplitude: 0.4 }), 16000)
    }
    slow.emit('StartSpeaking')
    slow.emit('ConfirmSpeaking')

    const sent = slowChunks.reduce((sum, chunk) => sum + chunk.length, 0)
    assert.equal(sent, 3 * CHUNK_SAMPLES, '300 ms of reserve was sent')
  })

  it('sends the moment before the VAD reacted', () => {
    // 100 ms of reserve is kept, which is the VAD delay
    feed(1, true)
    assert.equal(chunks.length, 0)

    vad.emit('StartSpeaking')
    vad.emit('ConfirmSpeaking')
    const sent = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    assert.equal(sent, CHUNK_SAMPLES, 'the reserve was sent, and only it')

    // And it holds sound, not the silence of a freshly opened buffer
    const level = Math.max(...pcm16ToFloat(chunks[0]))
    assert.ok(level > 0.3, `expected the reserve to hold speech, got ${level}`)
  })

  it('cuts the audio into 100 ms chunks', () => {
    vad.emit('StartSpeaking')
    vad.emit('ConfirmSpeaking')
    chunks.length = 0
    feed(1, true)
    assert.equal(chunks.length, 10)
    for (const chunk of chunks) {
      assert.equal(chunk.length, CHUNK_SAMPLES)
    }
  })

  it('resamples a 48 kHz microphone down to 16 kHz', () => {
    vad.emit('StartSpeaking')
    vad.emit('ConfirmSpeaking')
    chunks.length = 0
    feed(1, true, 48000)
    assert.equal(chunks.length, 10)
    for (const chunk of chunks) {
      assert.equal(chunk.length, CHUNK_SAMPLES)
    }
  })

  it('forgets what turned out to be noise', () => {
    feed(0.5, false)
    vad.emit('StartSpeaking')
    feed(0.5, true)
    vad.emit('CancelSpeaking')
    assert.equal(chunks.length, 0)

    // And it is not sent with the next turn either
    vad.emit('StartSpeaking')
    vad.emit('ConfirmSpeaking')
    const sent = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    assert.ok(sent <= CHUNK_SAMPLES, `${sent} samples came out of nowhere`)
  })

  it('sends the end of the sentence before closing the turn', () => {
    vad.emit('StartSpeaking')
    vad.emit('ConfirmSpeaking')
    chunks.length = 0
    events.length = 0

    // 250 ms, so two full chunks and a half one
    feed(0.25, true)
    assert.equal(chunks.length, 2)

    vad.emit('StopSpeaking')
    assert.equal(chunks.length, 3, 'the last half chunk is sent too')
    assert.equal(chunks[2].length, CHUNK_SAMPLES / 2)
    assert.deepEqual(events, ['StopSpeaking'])
    assert.equal(recorder.state.isSpeaking, false)
  })

  it('reports speaking state through StateChange', () => {
    const states: boolean[] = []
    recorder.on('StateChange', (state) => states.push(state.isSpeaking))
    vad.emit('StartSpeaking')
    vad.emit('ConfirmSpeaking')
    vad.emit('StopSpeaking')
    assert.deepEqual(states, [true, false])
  })

  it('sends nothing once stopped', () => {
    recorder.stop()
    assert.equal(recorder.state.isStarted, false)
    vad.emit('StartSpeaking')
    vad.emit('ConfirmSpeaking')
    feed(1, true)
    assert.equal(chunks.length, 0)
  })

  it('starts a second turn from scratch', () => {
    vad.emit('StartSpeaking')
    vad.emit('ConfirmSpeaking')
    feed(0.5, true)
    vad.emit('StopSpeaking')
    const first = chunks.length
    chunks.length = 0

    feed(0.5, false)
    vad.emit('StartSpeaking')
    vad.emit('ConfirmSpeaking')
    feed(0.5, true)
    vad.emit('StopSpeaking')
    assert.ok(first > 0 && chunks.length > 0)
  })
})
