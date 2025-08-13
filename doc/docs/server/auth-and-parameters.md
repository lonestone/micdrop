# Auth and Parameters

Handle user authentication and custom parameters in your voice server for secure and personalized conversations.

## Basic Parameter Handling

Use `waitForParams` to receive and validate client parameters:

```typescript
import { MicdropServer, waitForParams, handleError } from '@micdrop/server'
import { z } from 'zod'

// Define parameter schema
const paramsSchema = z.object({
  language: z.string().oneOf(['en', 'fr']).default('en'),
})

wss.on('connection', async (socket) => {
  try {
    // Wait for parameters from client
    const params = await waitForParams(socket, paramsSchema.parse)

    console.log('Client params:', params)

    // Use parameters to configure agent
    const agent = new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY,
      systemPrompt: `Respond in ${params.language} language`,
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
import {
  MicdropServer,
  MicdropError,
  MicdropErrorCode,
  waitForParams,
  handleError,
} from '@micdrop/server'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

async function validateJWT(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return { isValid: true, user: decoded }
  } catch (error) {
    return { isValid: false, error: error.message }
  }
}

const paramsSchema = z.object({
  authorization: z.string().startsWith('Bearer '),
})

wss.on('connection', async (socket) => {
  try {
    const params = await waitForParams(socket, paramsSchema.parse)

    // Validate JWT token
    const token = params.authorization.replace('Bearer ', '')
    const auth = await validateJWT(token)

    if (!auth.isValid) {
      throw new MicdropError(MicdropErrorCode.Unauthorized, 'Invalid JWT token')
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
import {
  MicdropServer,
  MicdropError,
  MicdropErrorCode,
  waitForParams,
  handleError,
} from '@micdrop/server'
import { z } from 'zod'

const validApiKeys = new Set([process.env.API_KEY_1, process.env.API_KEY_2])

const paramsSchema = z.object({
  apiKey: z.string(),
})

wss.on('connection', async (socket) => {
  try {
    const params = await waitForParams(socket, paramsSchema.parse)

    // Validate API key
    if (!validApiKeys.has(params.apiKey)) {
      throw new MicdropError(MicdropErrorCode.Unauthorized, 'Invalid API key')
    }

    // Setup AI components [..]

    // Start MicdropServer
    new MicdropServer(socket, { agent, stt, tts })
  } catch (error) {
    handleError(socket, error)
  }
})
```
