import { Readable } from 'stream'

export const waitForStreamEnd = (stream: Readable) =>
  new Promise<void>((resolve, reject) => {
    stream.on('data', () => {})
    stream.on('end', () => {
      setTimeout(() => {
        resolve()
      }, 100)
    })
    stream.on('error', (err) => {
      reject(err)
    })
  })
