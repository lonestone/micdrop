import * as fs from 'fs'
import * as path from 'path'

// Mock LLM, STT, TTS
// This mock is used when env is not set.
// It can be useful to test some parts of micdrop without needing to call AI systems.

let i = 1
let j = 1
const ttsCache = fs.readFileSync(
  path.join(__dirname, '../../demo-client/public/test.mp3')
)

export default {
  async generateAnswer() {
    return `Assistant Message ${i++}`
  },
  async text2Speech() {
    return ttsCache
  },
  async speech2Text() {
    return `User Message ${j++}`
  },
}
