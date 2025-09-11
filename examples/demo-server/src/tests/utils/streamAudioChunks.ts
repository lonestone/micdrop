import * as fs from 'fs'
import * as path from 'path'
import { PassThrough } from 'stream'

const chunkDir = path.join(__dirname, '../../../../demo-client/public')

// Function to stream audio chunks
export async function streamAudioChunks(audioStream: PassThrough) {
  try {
    let chunkIndex = 1

    while (true) {
      const chunkPath = path.join(chunkDir, `chunk-${chunkIndex}.wav`)

      if (!fs.existsSync(chunkPath)) break

      console.log(`Streaming chunk-${chunkIndex}.wav`)
      const chunkData = fs.readFileSync(chunkPath)
      audioStream.write(chunkData)

      // Add a small delay between chunks to simulate real-time streaming
      await new Promise((resolve) => setTimeout(resolve, 100))
      chunkIndex++
    }

    // End the stream
    audioStream.end()
  } catch (error) {
    console.error('Error streaming audio chunks:', error)
    audioStream.destroy(error as Error)
  }
}
