# Error Handling

Handle server-side errors gracefully with comprehensive error management and recovery strategies.

## Basic Error Handling

Use `handleError` utility for consistent error handling:

```typescript
import {
  MicdropServer,
  handleError,
  MicdropError,
  MicdropErrorCode,
} from '@micdrop/server'

wss.on('connection', async (socket) => {
  try {
    // Setup AI components
    const agent = new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY,
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
