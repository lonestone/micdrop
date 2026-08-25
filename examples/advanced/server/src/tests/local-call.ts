// Opens a real call against the running demo server, picking the fully local
// stack, and checks that the generated first message comes back as audio.
// The mic is never used: generateFirstMessage makes the assistant speak first.
import WebSocket from 'ws'

const URL = process.env.CALL_URL || 'ws://127.0.0.1:8081/call'

async function main() {
  const socket = new WebSocket(URL)
  const started = Date.now()
  let audioBytes = 0
  let firstAudioAt = 0
  let lastAudioAt = 0

  await new Promise<void>((resolve, reject) => {
    socket.on('open', () => resolve())
    socket.on('error', reject)
  })

  socket.send(
    JSON.stringify({
      authorization: '1234',
      lang: 'fr-FR',
      providers: {
        agent: { provider: 'ollama', model: 'qwen3:4b-instruct' },
        stt: {
          provider: process.env.STT_PROVIDER || 'whisper',
          model: process.env.STT_MODEL || 'base',
        },
        tts: {
          provider: process.env.TTS_PROVIDER || 'piper',
          model: process.env.TTS_MODEL || 'fr_FR-siwis-medium.onnx',
        },
      },
      // AUTO=autoEndCall,autoIgnoreUserNoise turns those two off
      auto: Object.fromEntries(
        (process.env.AUTO || '')
          .split(',')
          .filter(Boolean)
          .map((name) => [name, false])
      ),
    })
  )

  socket.on('message', (data: Buffer, isBinary: boolean) => {
    if (isBinary) {
      if (!firstAudioAt) firstAudioAt = Date.now()
      lastAudioAt = Date.now()
      audioBytes += data.length
      return
    }
    console.log(`server: ${data.toString().slice(0, 200)}`)
  })

  // Wait until the audio stops coming
  while (!lastAudioAt || Date.now() - lastAudioAt < 3000) {
    if (Date.now() - started > 60000) break
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(
    `\nfirst audio after ${firstAudioAt ? firstAudioAt - started : '-'}ms, ` +
      `${(audioBytes / 2 / 16000).toFixed(2)}s of speech`
  )
  socket.close()
  process.exit(audioBytes > 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
