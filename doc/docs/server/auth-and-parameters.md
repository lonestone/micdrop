# Auth and Parameters

Handle user authentication and custom parameters in your voice server for secure and personalized conversations.

## Basic Parameter Handling

Use `waitForParams` to receive and validate client parameters:

```typescript
import { MicdropServer, waitForParams, handleError } from '@micdrop/server'
import { z } from 'zod'

// Define parameter schema
const paramsSchema = z.object({
  authorization: z.string(),
  language: z.string().optional(),
  userId: z.string().optional(),
})

wss.on('connection', async (socket) => {
  try {
    // Wait for parameters from client
    const params = await waitForParams(socket, paramsSchema.parse, 5000)

    console.log('Client params:', params)

    // Use parameters to configure agent
    const agent = new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY,
      systemPrompt: `Respond in ${params.language || 'en'} language`,
    })

    // Setup STT and TTS [...]

    // Start MicdropServer
    new MicdropServer(socket, { agent, stt, tss })
  } catch (error) {
    handleError(socket, error)
  }
})
```

## Authentication Examples

### JWT Token Validation

```typescript
import jwt from 'jsonwebtoken'

async function validateJWT(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return { isValid: true, user: decoded }
  } catch (error) {
    return { isValid: false, error: error.message }
  }
}

wss.on('connection', async (socket) => {
  try {
    const params = await waitForParams(socket, (data) => {
      return z
        .object({
          authorization: z.string().startsWith('Bearer '),
        })
        .parse(data)
    })

    const token = params.authorization.replace('Bearer ', '')
    const auth = await validateJWT(token)

    if (!auth.isValid) {
      socket.close(1008, 'Authentication failed')
      return
    }

    // Use authenticated user data
    console.log('Authenticated user:', auth.user)

    // Setup AI components [..]

    // Start MicdropServer
    new MicdropServer(socket, { agent, stt, tts })
  } catch (error) {
    handleError(socket, error)
  }
})
```

### API Key Authentication

```typescript
const validApiKeys = new Set([process.env.API_KEY_1, process.env.API_KEY_2])

wss.on('connection', async (socket) => {
  try {
    const params = await waitForParams(socket, (data) => ({
      apiKey: z.string().parse(data.apiKey),
    }))

    if (!validApiKeys.has(params.apiKey)) {
      socket.close(1008, 'Invalid API key')
      return
    }

    // Setup AI components [..]

    // Start MicdropServer
    new MicdropServer(socket, { agent, stt, tts })
  } catch (error) {
    handleError(socket, error)
  }
})
```
