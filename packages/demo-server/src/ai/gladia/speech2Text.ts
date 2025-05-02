import WebSocket from 'ws'

abstract class TTS {
  abstract addAudio(audioBlob: Blob): void
  abstract transcribe(prevMessage?: string): Promise<string>
}

export class GladiaTTS extends TTS {
  private socket?: WebSocket

  async addAudio(audioBlob: Blob) {
    // Send audio chunk
    this.socket?.send(await audioBlob.arrayBuffer())
  }

  async transcribe() {
    return 'Hello'
  }

  private async init() {
    const response = await fetch('https://api.gladia.io/v2/live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gladia-Key': '<YOUR_GLADIA_API_KEY>',
      },
      body: JSON.stringify({
        encoding: 'wav/pcm',
        sample_rate: 16000,
        bit_depth: 16,
        channels: 1,
      }),
    })
    if (!response.ok) {
      throw new Error(
        `${response.status}: ${(await response.text()) || response.statusText}`
      )
    }

    const { id, url } = (await response.json()) as any
    if (typeof id !== 'string' || typeof url !== 'string') {
      throw new Error(
        'Invalid response from Gladia: ' + JSON.stringify({ id, url })
      )
    }

    this.socket = this.initWS(url)
  }

  initWS(url: string) {
    const socket = new WebSocket(url)

    socket.addEventListener('open', function () {
      // Connection is opened. You can start sending audio chunks.
    })

    socket.addEventListener('error', function (error) {
      // An error occurred during the connection.
      // Check the error to understand why
    })

    socket.addEventListener('close', function ({ code, reason }) {
      // The connection has been closed
      // If the "code" is equal to 1000, it means we closed intentionally the connection (after the end of the session for example).
      // Otherwise, you can reconnect to the same url.
    })

    socket.addEventListener('message', function (event) {
      // All the messages we are sending are in JSON format
      const message = JSON.parse(event.data.toString())
      console.log(JSON.stringify(message, null, 2))
    })

    return socket
  }
}
