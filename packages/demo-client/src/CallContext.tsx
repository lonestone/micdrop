import {
  CallHandler,
  CallHandlerError,
  Conversation,
  Mic,
} from '@micdrop/client'
import type { CallParams } from '@micdrop/demo-server/src/callParams'
import React, { createContext, useCallback, useEffect, useState } from 'react'

export interface CallContextValue {
  start: () => Promise<void>
  stop: () => void
  startMic: (deviceId?: string) => Promise<void>
  changeMicThreshold: (threshold: number) => void
  pause: () => void
  resume: () => void
  isStarting: boolean
  isStarted: boolean
  isPaused: boolean
  isSpeaking: boolean
  isMicStarted: boolean
  isProcessing: boolean
  micThreshold: number
  conversation: Conversation
  error: CallHandlerError | undefined
}

export const CallContext = createContext<CallContextValue | undefined>(
  undefined
)

interface CallContextProviderProps {
  children: React.ReactNode
}

export function CallContextProvider({ children }: CallContextProviderProps) {
  // Setup call handler
  const call = CallHandler.getInstance<CallParams>({
    vad: 'silero',
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
        isStarted: call.isStarted,
        isStarting: call.isStarting,
        isMicStarted: call.isMicStarted,
        conversation: call.conversation,
        isPaused: call.micRecorder.state.isMuted,
        isSpeaking: call.micRecorder.state.isSpeaking,
        isProcessing: call.isProcessing,
        micThreshold: call.micRecorder.state.threshold,
      }))
    })

    // Handle errors
    call.on('Error', (error) => {
      setValue((v) => ({
        ...v,
        error,
      }))
    })

    // Handle end of interview
    call.on('EndInterview', () => {
      call.stop()
      console.log('EndInterview')
    })

    return () => {
      call.removeAllListeners()
    }
  }, [])

  // Provider value
  const [value, setValue] = useState<CallContextValue>(() => ({
    start: handleStart,
    stop: handleStop,
    startMic: call.startMic.bind(call),
    changeMicThreshold: call.micRecorder.setThreshold.bind(call.micRecorder),
    pause: call.pause.bind(call),
    resume: call.resume.bind(call),
    isStarting: false,
    isStarted: false,
    isPaused: false,
    isSpeaking: false,
    isMicStarted: false,
    isProcessing: false,
    micThreshold: Mic.defaultMicThreshold,
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
