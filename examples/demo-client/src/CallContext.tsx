import {
  Micdrop,
  MicdropClientError,
  MicdropConversation,
} from '@micdrop/client'
import React, { createContext, useEffect, useState } from 'react'

export interface CallContextValue {
  isStarting: boolean
  isStarted: boolean
  isPaused: boolean
  isListening: boolean
  isProcessing: boolean
  isUserSpeaking: boolean
  isAssistantSpeaking: boolean
  isMicStarted: boolean
  isMicMuted: boolean
  conversation: MicdropConversation
  error: MicdropClientError | undefined
}

export const CallContext = createContext<CallContextValue | undefined>(
  undefined
)

interface CallContextProviderProps {
  children: React.ReactNode
}

export function CallContextProvider({ children }: CallContextProviderProps) {
  useEffect(() => {
    // Handle state changes
    Micdrop.on('StateChange', () => {
      setValue((v) => ({
        ...v,
        conversation: Micdrop.conversation,
        isStarting: Micdrop.isStarting,
        isStarted: Micdrop.isStarted,
        isPaused: Micdrop.isPaused,
        isListening: Micdrop.isListening,
        isProcessing: Micdrop.isProcessing,
        isUserSpeaking: Micdrop.isUserSpeaking,
        isAssistantSpeaking: Micdrop.isAssistantSpeaking,
        isMicStarted: Micdrop.isMicStarted,
        isMicMuted: Micdrop.isMicMuted,
      }))
    })

    // Handle errors
    Micdrop.on('Error', (error) => {
      setValue((v) => ({
        ...v,
        error,
      }))
    })

    // Handle end of call
    Micdrop.on('EndCall', () => {
      Micdrop.stop()
      console.log('Call ended by assistant')
    })

    // Stop call on unmount
    return () => {
      Micdrop.stop()
      Micdrop.removeAllListeners()
    }
  }, [])

  // Provider value
  const [value, setValue] = useState<CallContextValue>(() => ({
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

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>
}
