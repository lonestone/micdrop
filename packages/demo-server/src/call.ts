import {
  CallError,
  CallErrorCode,
  CallSocket,
  handleError,
  waitForParams,
} from '@micdrop/server'
import { FastifyInstance } from 'fastify'
import * as fs from 'fs'
import * as path from 'path'
import { callParamsSchema } from './callParams'

export default async (app: FastifyInstance) => {
  app.get('/call', { websocket: true }, async (socket, req) => {
    try {
      // Get params from first message
      // Optional, only if we want to check authorization and/or get other params
      const params = await waitForParams(socket, callParamsSchema.parse)
      if (params.authorization !== '1234') {
        throw new CallError(CallErrorCode.Unauthorized, 'Invalid authorization')
      }

      // Start call
      new CallSocket(socket, {
        systemPrompt: 'You are a helpful assistant',
        firstMessage: 'Hello!',
        generateAnswer,
        speech2Text,
        text2Speech,
      })
    } catch (error) {
      handleError(socket, error)
    }
  })
}

let i = 1
async function generateAnswer() {
  return `Assistant Message ${i++}`
}

const ttsCache = fs.readFileSync(
  path.join(__dirname, '../../demo-client/public/test.mp3')
)
async function text2Speech() {
  return ttsCache
}

let j = 1
async function speech2Text() {
  return `User Message ${j++}`
}
