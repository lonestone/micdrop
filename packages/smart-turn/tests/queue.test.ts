import assert from 'node:assert'
import { describe, it } from 'node:test'
import { queueOnnxRun } from '../src/queue'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('queueOnnxRun', () => {
  it('never lets two runs overlap', async () => {
    // The runtime holds one active session, so a second run starting while the
    // first is still waiting on the graphics card breaks both
    let running = 0
    let overlaps = 0

    const run = async (ms: number) => {
      running++
      if (running > 1) overlaps++
      await wait(ms)
      running--
      return ms
    }

    const results = await Promise.all([
      queueOnnxRun(() => run(20)),
      queueOnnxRun(() => run(1)),
      queueOnnxRun(() => run(10)),
    ])

    assert.equal(overlaps, 0)
    assert.deepEqual(results, [20, 1, 10])
  })

  it('keeps the order it was asked in', async () => {
    const order: number[] = []
    await Promise.all(
      [30, 1, 15].map((ms, index) =>
        queueOnnxRun(async () => {
          await wait(ms)
          order.push(index)
        })
      )
    )
    assert.deepEqual(order, [0, 1, 2])
  })

  it('lets the next run through after a failure', async () => {
    const failing = queueOnnxRun(async () => {
      throw new Error('the runtime gave up')
    })
    await assert.rejects(() => failing, /gave up/)
    assert.equal(await queueOnnxRun(async () => 'still works'), 'still works')
  })
})
