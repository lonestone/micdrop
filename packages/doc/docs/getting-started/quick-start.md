# Quick Start

Build your first voice AI application with Micdrop in just 5 minutes! This guide will create a basic setup with OpenAI, ElevenLabs, and Gladia.

## 1. Install Packages

```bash
npm install @micdrop/client @micdrop/server @micdrop/openai @micdrop/elevenlabs @micdrop/gladia
```

## 2. Set Environment Variables

Create a `.env` file in your project root:

```bash title=".env"
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
GLADIA_API_KEY=your_gladia_api_key_here
```

## 3. Create the Server

```typescript title="server.ts"
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { GladiaSTT } from '@micdrop/gladia'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (socket) => {
  // Setup AI components
  const agent = new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY!,
    systemPrompt: 'You are a helpful voice assistant. Keep responses concise.',
  })

  const stt = new GladiaSTT({
    apiKey: process.env.GLADIA_API_KEY!,
  })

  const tts = new ElevenLabsTTS({
    apiKey: process.env.ELEVENLABS_API_KEY!,
    voiceId: process.env.ELEVENLABS_VOICE_ID!,
  })

  // Create the voice conversation handler
  new MicdropServer(socket, {
    firstMessage: 'Hello! How can I help you today?',
    agent,
    stt,
    tts,
  })
})

console.log('🎤 Micdrop server running on ws://localhost:8080')
```

## 4. Create the Client

```html title="index.html"
<!DOCTYPE html>
<html>
<head>
    <title>My First Micdrop App</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
        }
        .controls {
            text-align: center;
            margin: 20px 0;
        }
        button {
            padding: 10px 20px;
            margin: 5px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .start-btn { background: #4CAF50; color: white; }
        .stop-btn { background: #f44336; color: white; }
        .status {
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            text-align: center;
        }
        .listening { background: #e8f5e8; color: #2e7d32; }
        .processing { background: #fff3e0; color: #f57c00; }
        .speaking { background: #e3f2fd; color: #1976d2; }
    </style>
</head>
<body>
    <h1>🎤 My First Micdrop App</h1>
    
    <div class="controls">
        <button id="startBtn" class="start-btn">Start Conversation</button>
        <button id="stopBtn" class="stop-btn" disabled>Stop Conversation</button>
    </div>
    
    <div id="status" class="status">
        Click "Start Conversation" to begin
    </div>
    
    <div id="conversation">
        <h3>Conversation:</h3>
        <div id="messages"></div>
    </div>

    <script type="module">
        import { Micdrop } from 'https://unpkg.com/@micdrop/client@latest/dist/index.js'
        
        const startBtn = document.getElementById('startBtn')
        const stopBtn = document.getElementById('stopBtn')
        const status = document.getElementById('status')
        const messages = document.getElementById('messages')
        
        // Event handlers
        Micdrop.on('StateChange', (state) => {
            updateStatus(state)
        })
        
        Micdrop.on('EndCall', () => {
            console.log('Call ended by assistant')
            handleStop()
        })
        
        Micdrop.on('Error', (error) => {
            console.error('Error:', error)
            status.textContent = `Error: ${error.message}`
            status.className = 'status'
            handleStop()
        })
        
        // Button handlers
        startBtn.addEventListener('click', async () => {
            try {
                await Micdrop.start({
                    url: 'ws://localhost:8080',
                    vad: ['volume', 'silero'],
                    debugLog: true
                })
                
                startBtn.disabled = true
                stopBtn.disabled = false
                
            } catch (error) {
                console.error('Failed to start:', error)
                status.textContent = `Failed to start: ${error.message}`
            }
        })
        
        stopBtn.addEventListener('click', handleStop)
        
        async function handleStop() {
            await Micdrop.stop()
            startBtn.disabled = false
            stopBtn.disabled = true
            status.textContent = 'Conversation stopped'
            status.className = 'status'
        }
        
        function updateStatus(state) {
            if (state.isListening) {
                status.textContent = '🎤 Listening... Speak now!'
                status.className = 'status listening'
            } else if (state.isProcessing) {
                status.textContent = '🤔 Processing your message...'
                status.className = 'status processing'
            } else if (state.isAssistantSpeaking) {
                status.textContent = '🔊 Assistant speaking...'
                status.className = 'status speaking'
            } else if (state.isStarted) {
                status.textContent = '✅ Connected'
                status.className = 'status'
            }
            
            // Add conversation messages
            if (state.conversation) {
                const conversationHtml = state.conversation
                    .filter(msg => msg.role !== 'system')
                    .map(msg => `
                        <div style="margin: 10px 0; padding: 10px; border-radius: 5px; 
                                    background: ${msg.role === 'user' ? '#e8f5e8' : '#e3f2fd'}">
                            <strong>${msg.role === 'user' ? 'You' : 'Assistant'}:</strong>
                            ${msg.content}
                        </div>
                    `).join('')
                    
                messages.innerHTML = conversationHtml
            }
        }
    </script>
</body>
</html>
```

## 5. Run Your App

Start the server:

```bash
# Install dependencies if needed
npm install ws @types/ws

# Run the server
npx tsx server.ts
# or
node server.js  # if compiled
```

Open `index.html` in your browser and click "Start Conversation"!

## What's Happening?

1. **Server Setup**: Creates WebSocket server with AI components
2. **Client Connection**: Browser connects and starts audio capture
3. **Voice Detection**: Client detects when you speak using VAD
4. **Speech-to-Text**: Audio sent to Gladia for transcription
5. **AI Response**: OpenAI generates response based on conversation
6. **Text-to-Speech**: ElevenLabs converts response to speech
7. **Audio Playback**: Browser plays the AI response

## Next Steps

🎉 **Congratulations!** You've built your first voice AI app with Micdrop.

**Enhance your app:**
- [Add React hooks](../packages/react/) for better state management
- [Customize the AI agent](./core-concepts.md#agents) behavior
- [Configure Voice Activity Detection](../packages/client/vad.md)
- [Handle errors and edge cases](./your-first-app.md#error-handling)
- [Deploy to production](../guides/deployment.md)

**Explore examples:**
- [Demo Client](../examples/demo-client.md) - Full React application
- [Demo Server](../examples/demo-server.md) - Production-ready server
- [Custom Implementations](../examples/custom-implementations.md) - Build your own AI components

## Troubleshooting

**Microphone not working?**
- Check browser permissions for microphone access
- Ensure you're serving over HTTPS in production

**WebSocket connection fails?**
- Verify the server is running on the correct port
- Check firewall settings

**AI responses not working?**
- Verify all API keys are set correctly
- Check the server console for error messages

Need more help? Check our [detailed troubleshooting guide](../guides/troubleshooting.md)!