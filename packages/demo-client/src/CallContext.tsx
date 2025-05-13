import { CallClient, CallClientError, Conversation } from '@micdrop/client'
import type { CallParams } from '@micdrop/demo-server/src/callParams'
import React, { createContext, useCallback, useEffect, useState } from 'react'

export interface CallContextValue {
  start: () => Promise<void>
  stop: () => void
  startMic: (deviceId?: string) => Promise<void>
  pause: () => void
  resume: () => void
  isStarting: boolean
  isStarted: boolean
  isPaused: boolean
  isListening: boolean
  isProcessing: boolean
  isUserSpeaking: boolean
  isAssistantSpeaking: boolean
  isMicStarted: boolean
  isMicMuted: boolean
  conversation: Conversation
  error: CallClientError | undefined
}

export const CallContext = createContext<CallContextValue | undefined>(
  undefined
)

interface CallContextProviderProps {
  children: React.ReactNode
}

export function CallContextProvider({ children }: CallContextProviderProps) {
  // Setup call handler
  const call = CallClient.getInstance<CallParams>({
    vad: ['silero', 'volume'],
  })

  // Start call
  const handleStart = useCallback(async () => {
    setValue((v) => ({
      ...v,
      error: undefined,
    }))

    call.url = 'ws://localhost:8081/call'
    call.params = {
      authorization: '1234',
    }
    call.debug = true
    call.start()
  }, [])

  // Stop call
  const handleStop = useCallback(() => {
    call.stop()
  }, [])

  useEffect(() => {
    // Handle state changes
    call.on('StateChange', () => {
      setValue((v) => ({
        ...v,
        conversation: call.conversation,
        isStarting: call.isStarting,
        isStarted: call.isStarted,
        isPaused: call.isPaused,
        isListening: call.isListening,
        isProcessing: call.isProcessing,
        isUserSpeaking: call.isUserSpeaking,
        isAssistantSpeaking: call.isAssistantSpeaking,
        isMicStarted: call.isMicStarted,
        isMicMuted: call.isMicMuted,
      }))
    })

    // Handle errors
    call.on('Error', (error) => {
      setValue((v) => ({
        ...v,
        error,
      }))
    })

    // Handle end of call
    call.on('EndCall', () => {
      call.stop()
      console.log('Call ended by assistant')
    })

    // Stop call on unmount
    return () => {
      call.stop()
      call.removeAllListeners()
    }
  }, [])

  // Provider value
  const [value, setValue] = useState<CallContextValue>(() => ({
    start: handleStart,
    stop: handleStop,
    startMic: call.startMic.bind(call),
    pause: call.pause.bind(call),
    resume: call.resume.bind(call),
    isStarting: false,
    isStarted: false,
    isPaused: false,
    isListening: false,
    isProcessing: false,
    isUserSpeaking: false,
    isAssistantSpeaking: false,
    isMicStarted: false,
    isMicMuted: false,
    conversation: [],
    error: undefined,
  }))

  // Update values that have deps
  useEffect(() => {
    setValue((v) => ({
      ...v,
      start: handleStart,
    }))
  }, [handleStart])

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>
}
