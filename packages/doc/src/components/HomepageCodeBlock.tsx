import { useState } from 'react'
import { CustomCodeBlock } from './CustomCodeBlock'

export function HomepageCodeBlock() {
  const [activeTab, setActiveTab] = useState('client')

  return (
    <div className="relative h-[600px]">
      <div className="bg-ai-surface-950 rounded-xl overflow-hidden shadow-2xl border border-ai-surface-700/50 border-glow-hover animate-fade-in h-full flex flex-col">
        {/* Top Tabs */}
        <div className="bg-ai-surface-900/50 border-b border-ai-surface-700/50 px-6 py-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('client')}
              className={`px-6 py-3 font-mono text-sm font-medium transition-colors ${
                activeTab === 'client'
                  ? 'bg-ai-primary-500/20 text-ai-primary-200'
                  : 'text-ai-surface-400'
              }`}
            >
              Client (browser)
            </button>
            <button
              onClick={() => setActiveTab('server')}
              className={`px-6 py-3 font-mono text-sm font-medium transition-colors ${
                activeTab === 'server'
                  ? 'bg-ai-accent-500/20 text-ai-accent-200'
                  : 'text-ai-surface-400'
              }`}
            >
              Server (Node.js)
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 bg-ai-surface-950 overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            {activeTab === 'client' && (
              <>
                <CustomCodeBlock
                  language="bash"
                  title="bash"
                  code={`npm install @micdrop/client`}
                />
                <CustomCodeBlock
                  language="typescript"
                  title="typescript"
                  code={`import { Micdrop } from '@micdrop/client'

// Start a voice conversation
await Micdrop.start({
  url: 'wss://your-server.com/call'
})

// Listen for events
Micdrop.on('StateChange', (state) => {
  console.log('State:', state)
})

Micdrop.on('EndCall', () => {
  console.log('Call ended by assistant')
})`}
                />
              </>
            )}

            {activeTab === 'server' && (
              <>
                <CustomCodeBlock
                  language="bash"
                  title="bash"
                  code={`npm install @micdrop/server \\
  @micdrop/openai \\
  @micdrop/gladia \\
  @micdrop/elevenlabs`}
                />
                <CustomCodeBlock
                  language="typescript"
                  title="typescript"
                  code={`import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { GladiaSTT } from '@micdrop/gladia'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (socket) => {
  // Setup AI components
  const agent = new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY,
    systemPrompt: 'You are a helpful assistant'
  })
  
  const stt = new GladiaSTT({
    apiKey: process.env.GLADIA_API_KEY
  })
  
  const tts = new ElevenLabsTTS({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID
  })

  // Handle voice conversations
  new MicdropServer(socket, {
    firstMessage: 'Hello! How can I help you today?',
    agent,
    stt,
    tts,
  })
})`}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
