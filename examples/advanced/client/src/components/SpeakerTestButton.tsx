import { Speaker } from '@micdrop/client'
import { useMicdropState } from '@micdrop/react'
import React, { useRef, useState } from 'react'
import { FaPlay, FaStop } from 'react-icons/fa'

interface SpeakerTestButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function SpeakerTestButton(props: SpeakerTestButtonProps) {
  const { isAssistantSpeaking } = useMicdropState()
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<number | undefined>()

  const handleClick = async () => {
    clearTimeout(timeoutRef.current)

    if (Speaker.isPlaying) {
      Speaker.stopAudio()
      return
    }

    setLoading(true)

    const filepathPattern = '/chunk-{i}.wav'
    let i = 1

    const playNextChunk = async () => {
      // Fetch audio chunk
      const filepath = filepathPattern.replace('{i}', i.toString())
      const result = await fetch(filepath)
      if (!result.ok) return

      // Play audio
      const audioBlob = await result.blob()
      console.log('Playing audio chunk', audioBlob)
      Speaker.playAudio(audioBlob)
      i++
      setLoading(false)

      // Schedule next chunk
      timeoutRef.current = window.setTimeout(playNextChunk, 100)
    }

    playNextChunk()
  }

  const { className, disabled, ...restProps } = props

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      className={`
        inline-flex items-center px-4 py-1
        border-2 border-blue-500 text-blue-500 rounded-md
        hover:bg-blue-50
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className || ''}
      `}
      {...restProps}
    >
      {isAssistantSpeaking ? (
        <FaStop size={14} className="mr-2" />
      ) : (
        <FaPlay size={14} className="mr-2" />
      )}
      Test
    </button>
  )
}
