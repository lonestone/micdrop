# Error Handling

Handle server-side errors gracefully with comprehensive error management and recovery strategies.

## Basic Error Handling

Use `handleError` utility for consistent error handling:

```typescript
import { MicdropServer, handleError, MicdropError, MicdropErrorCode } from '@micdrop/server'

wss.on('connection', async (socket) => {
  try {
    // Setup AI components
    const agent = new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY
    })

    new MicdropServer(socket, { agent, tts })
    
  } catch (error) {
    // Handle setup errors
    handleError(socket, error)
  }
})
```

## Custom Error Types

Create specific error responses:

```typescript
import { MicdropError, MicdropErrorCode } from '@micdrop/server'

wss.on('connection', async (socket) => {
  try {
    // Validate environment
    if (!process.env.OPENAI_API_KEY) {
      throw new MicdropError(
        MicdropErrorCode.InternalServer,
        'OpenAI API key not configured'
      )
    }

    // Check authentication
    const params = await waitForParams(socket, validateParams)
    if (!isValidAuth(params.authorization)) {
      throw new MicdropError(
        MicdropErrorCode.Unauthorized,
        'Invalid authorization token'
      )
    }

  } catch (error) {
    handleError(socket, error)
  }
})
```

## AI Provider Error Handling

Handle AI service errors:

```typescript
agent.on('error', (error) => {
  console.error('AI Agent error:', error)
  
  // Handle specific OpenAI errors
  if (error.response?.status === 429) {
    console.log('Rate limit hit, implementing backoff...')
  } else if (error.response?.status === 401) {
    console.error('Invalid API key')
  }
})

tts.on('error', (error) => {
  console.error('TTS error:', error)
  // Implement TTS fallback logic
})
```

For detailed error handling patterns and recovery strategies, see the [server README](../../packages/server/README.md).