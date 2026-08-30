import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { SpeakerController } from '../src/audio/Speaker'
import { MultipleVAD } from '../src/audio/vad/MultipleVAD'
import { VADStatus } from '../src/audio/vad/VAD'
import { VolumeVAD } from '../src/audio/vad/VolumeVAD'
import { FakeMicSource, FakeSpeakerDriver } from './fakes'

describe('Speaker', () => {
  let driver: FakeSpeakerDriver
  let speaker: SpeakerController

  beforeEach(async () => {
    driver = new FakeSpeakerDriver()
    speaker = new SpeakerController()
    speaker.setDriver(driver)
    await speaker.start()
  })

  it('refuses to play without a driver', () => {
    const bare = new SpeakerController()
    assert.throws(() => bare.getDriver())
  })

  it('hands the samples to the driver', () => {
    speaker.playAudio(new Int16Array([1, 2, 3]))
    assert.deepEqual(Array.from(driver.allSamples), [1, 2, 3])
  })

  it('says when the assistant has the floor', () => {
    const events: string[] = []
    speaker.on('StartPlaying', () => events.push('StartPlaying'))
    speaker.on('StopPlaying', () => events.push('StopPlaying'))

    speaker.playAudio(new Int16Array([1, 2, 3]))
    assert.equal(speaker.isPlaying, true)

    speaker.stopAudio()
    assert.equal(speaker.isPlaying, false)
    assert.deepEqual(events, ['StartPlaying', 'StopPlaying'])
  })

  it('follows the level of what is being played', () => {
    const volumes: number[] = []
    speaker.on('Volume', (volume) => volumes.push(volume))

    driver.emit('Volume', -12)
    assert.equal(speaker.volume, -12)

    driver.setPlaying(true)
    driver.setPlaying(false)
    assert.equal(speaker.volume, -Infinity, 'the meter empties on silence')
    assert.deepEqual(volumes, [-12])
  })

  it('remembers the output across calls', async () => {
    await speaker.changeDevice('headphones')
    assert.equal(speaker.deviceId, 'headphones')

    const other = new FakeSpeakerDriver()
    const next = new SpeakerController()
    next.setDriver(other)
    await next.start()
    assert.equal(other.deviceId, 'headphones', 'the saved output was restored')
  })

  it('forgets an output the machine no longer has', async () => {
    await speaker.changeDevice('headphones')

    const other = new FakeSpeakerDriver()
    other.devices = [{ id: 'speaker', label: 'Speaker', kind: 'audiooutput' }]
    const next = new SpeakerController()
    next.setDriver(other)
    await next.start()
    assert.equal(other.deviceId, undefined, 'it falls back to the default')
  })
})

describe('MultipleVAD', () => {
  const LOUD = -20
  const QUIET = -80

  let mic: FakeMicSource
  let vad: MultipleVAD
  let events: string[]

  beforeEach(async () => {
    mic = new FakeMicSource()
    vad = new MultipleVAD([
      new VolumeVAD({ threshold: -50 }),
      new VolumeVAD({ threshold: -30 }),
    ])
    events = []
    for (const name of [
      'StartSpeaking',
      'ConfirmSpeaking',
      'CancelSpeaking',
      'StopSpeaking',
    ] as const) {
      vad.on(name, () => events.push(name))
    }
    await vad.start(mic)
  })

  it('opens a turn as soon as one of them hears something', () => {
    // -40 dBFS is above the first threshold and below the second
    mic.volume(-40, -40, -40)
    assert.deepEqual(events, ['StartSpeaking'])
    assert.equal(vad.status, VADStatus.MaybeSpeaking)
  })

  it('confirms once they agree', () => {
    mic.volume(LOUD, LOUD, LOUD)
    assert.deepEqual(events, ['StartSpeaking', 'ConfirmSpeaking'])
    assert.equal(vad.status, VADStatus.Speaking)
  })

  it('closes the turn once they are all quiet again', () => {
    mic.volume(LOUD, LOUD, LOUD)
    events.length = 0
    mic.volume(...new Array(10).fill(QUIET))
    assert.deepEqual(events, ['StopSpeaking'])
    assert.equal(vad.status, VADStatus.Silence)
  })

  it('pauses and resumes every one of them', async () => {
    await vad.pause()
    assert.equal(vad.isPaused, true)
    mic.volume(LOUD, LOUD, LOUD, LOUD)
    assert.deepEqual(events, [])

    await vad.resume()
    assert.equal(vad.isPaused, false)
    mic.volume(LOUD, LOUD, LOUD)
    assert.deepEqual(events, ['StartSpeaking', 'ConfirmSpeaking'])
  })

  it('stops listening once stopped', async () => {
    await vad.stop()
    assert.equal(vad.isStarted, false)
    mic.volume(LOUD, LOUD, LOUD)
    assert.deepEqual(events, [])
  })
})
