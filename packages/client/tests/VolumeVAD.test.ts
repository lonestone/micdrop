import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { VADStatus } from '../src/audio/vad/VAD'
import { VolumeVAD } from '../src/audio/vad/VolumeVAD'
import { FakeMicSource } from './fakes'

const LOUD = -20
const QUIET = -80

/** The microphone reports a level this often, see Mic */
const VOLUME_INTERVAL = 100

/** How many level reports VolumeVAD needs before it opens a turn */
function countWindowsBeforeStart(): number {
  const source = new FakeMicSource()
  const detector = new VolumeVAD()
  let windows = 0
  let opened = 0
  detector.on('StartSpeaking', () => (opened = windows))
  detector.start(source)

  while (opened === 0 && windows < 20) {
    windows++
    source.volume(LOUD)
  }
  return opened
}

function record(vad: VolumeVAD) {
  const events: string[] = []
  for (const name of [
    'StartSpeaking',
    'ConfirmSpeaking',
    'CancelSpeaking',
    'StopSpeaking',
  ] as const) {
    vad.on(name, () => events.push(name))
  }
  return events
}

describe('VolumeVAD', () => {
  let mic: FakeMicSource
  let vad: VolumeVAD
  let events: string[]

  beforeEach(async () => {
    mic = new FakeMicSource()
    vad = new VolumeVAD()
    events = record(vad)
    await vad.start(mic)
  })

  it('stays quiet when nothing is said', () => {
    mic.volume(QUIET, QUIET, QUIET, QUIET, QUIET, QUIET)
    assert.deepEqual(events, [])
    assert.equal(vad.status, VADStatus.Silence)
  })

  it('confirms speech after a few loud samples', () => {
    mic.volume(LOUD, LOUD, LOUD)
    assert.deepEqual(events, ['StartSpeaking', 'ConfirmSpeaking'])
    assert.equal(vad.status, VADStatus.Speaking)
  })

  it('cancels a lone burst of noise', () => {
    mic.volume(LOUD, LOUD)
    assert.deepEqual(events, ['StartSpeaking'])
    mic.volume(QUIET, QUIET)
    assert.deepEqual(events, ['StartSpeaking', 'CancelSpeaking'])
    assert.equal(vad.status, VADStatus.Silence)
  })

  it('ends the turn once the room goes quiet again', () => {
    mic.volume(LOUD, LOUD, LOUD, LOUD, LOUD)
    events.length = 0
    mic.volume(QUIET, QUIET, QUIET, QUIET, QUIET)
    assert.deepEqual(events, [], 'a short pause is not the end of a sentence')
    mic.volume(QUIET, QUIET, QUIET)
    assert.deepEqual(events, ['StopSpeaking'])
    assert.equal(vad.status, VADStatus.Silence)
  })

  it('speaks again after a first turn', () => {
    mic.volume(LOUD, LOUD, LOUD)
    mic.volume(...new Array(10).fill(QUIET))
    events.length = 0
    mic.volume(LOUD, LOUD, LOUD)
    assert.deepEqual(events, ['StartSpeaking', 'ConfirmSpeaking'])
  })

  it('hears nothing while paused', async () => {
    await vad.pause()
    assert.equal(vad.isPaused, true)
    mic.volume(LOUD, LOUD, LOUD, LOUD)
    assert.deepEqual(events, [])

    await vad.resume()
    mic.volume(LOUD, LOUD, LOUD)
    assert.deepEqual(events, ['StartSpeaking', 'ConfirmSpeaking'])
  })

  it('closes the turn it had opened when it is paused', async () => {
    mic.volume(LOUD, LOUD, LOUD)
    events.length = 0
    await vad.pause()
    assert.deepEqual(events, ['StopSpeaking'])
  })

  it('drops the turn it was unsure about when it is stopped', async () => {
    mic.volume(LOUD, LOUD)
    events.length = 0
    await vad.stop()
    assert.deepEqual(events, ['CancelSpeaking'])
  })

  it('stops listening to the microphone once stopped', async () => {
    await vad.stop()
    mic.volume(LOUD, LOUD, LOUD, LOUD)
    assert.deepEqual(events, [])
  })

  it('follows the threshold it is given', async () => {
    const loudVad = new VolumeVAD({ threshold: -10 })
    const loudEvents = record(loudVad)
    await loudVad.start(mic)
    mic.volume(LOUD, LOUD, LOUD)
    assert.deepEqual(loudEvents, [], '-20 dBFS is below a -10 dBFS threshold')
  })

  it('declares a delay that covers the time it takes to react', () => {
    // The reserve MicRecorder keeps is exactly vad.delay, so a VAD that says
    // less than it needs loses the first syllable of every sentence
    const windows = countWindowsBeforeStart()
    const measuredLatency = windows * VOLUME_INTERVAL

    assert.ok(
      vad.delay >= measuredLatency,
      `VolumeVAD reacts after ${measuredLatency} ms but only asks for ${vad.delay} ms of reserve`
    )
  })

  it('refuses a history too short to tell noise from speech', () => {
    assert.throws(() => new VolumeVAD({ history: 2 }))
  })
})
