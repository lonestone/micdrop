import * as fs from 'fs'
import * as path from 'path'

const ttsCache = fs.readFileSync(
  path.join(__dirname, '../../../../demo-client/public/test.mp3')
)

export async function text2Speech() {
  return ttsCache
}
