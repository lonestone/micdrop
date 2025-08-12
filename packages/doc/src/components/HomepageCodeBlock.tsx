import { useState } from 'react'
import { CustomCodeBlock } from './CustomCodeBlock'

function getTabStyle(active: boolean) {
  return active
    ? 'tab-active text-ai-primary-800 dark:text-ai-primary-200 bg-ai-surface-50 dark:bg-ai-surface-800'
    : 'tab-inactive text-ai-surface-700 dark:text-ai-surface-400 bg-ai-surface-200 dark:bg-ai-surface-700'
}

export function HomepageCodeBlock() {
  const [activeTab, setActiveTab] = useState('client')

  return (
    <div className="bg-ai-surface-50 dark:bg-ai-surface-800 light:bg-ai-surface-100 rounded-xl animate-fade-in h-full flex flex-col glow-shadow">
      {/* Top Tabs */}
      <div className="flex">
        <button
          onClick={() => setActiveTab('client')}
          className={`flex-1 px-6 py-3 border-0 font-mono text-sm font-medium transition-colors rounded-tl-xl cursor-pointer ${getTabStyle(
            activeTab === 'client'
          )}`}
        >
          Client (browser)
        </button>
        <button
          onClick={() => setActiveTab('server')}
          className={`flex-1 px-6 py-3 border-0 font-mono text-sm font-medium transition-colors rounded-tr-xl cursor-pointer ${getTabStyle(
            activeTab === 'server'
          )}`}
        >
          Server (Node.js)
        </button>
      </div>

      {/* Code Content */}
      <div className="flex-1 flex flex-col gap-6 rounded-b-xl p-6 tab-content">
        {activeTab === 'client' && (
          <>
            <CustomCodeBlock
              language="bash"
              code={`npm install @micdrop/client`}
            />
            <CustomCodeBlock
              language="typescript"
              code={`import { Micdrop } from '@micdrop/client'

// Start a voice conversation
Micdrop.start({
  url: 'wss://your-server.com/'
})

// Listen for events
Micdrop.on('StateChange', (state) => {
  console.log('Conversation:', state.conversation)
  console.log('isAssistantSpeaking:', state.isAssistantSpeaking)
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
              code={`npm install @micdrop/server \\
  @micdrop/openai \\
  @micdrop/gladia \\
  @micdrop/elevenlabs`}
            />
            <CustomCodeBlock
              language="typescript"
              code={`import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { GladiaSTT } from '@micdrop/gladia'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 443 })

wss.on('connection', (socket) => {
  // Handle voice conversation
  new MicdropServer(socket, {
    firstMessage: 'How can I help you today?',

    agent: new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY,
      systemPrompt: 'You are a helpful assistant'
    }),

    stt: new GladiaSTT({
      apiKey: process.env.GLADIA_API_KEY
    }),

    tts: new ElevenLabsTTS({
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: process.env.ELEVENLABS_VOICE_ID
    })
  })
})`}
            />
          </>
        )}
      </div>
    </div>
  )
}
