import { Speaker } from '@micdrop/client'
import React, { useState } from 'react'
import { FaPlay, FaStop } from 'react-icons/fa'

interface SpeakerTestButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function SpeakerTestButton(props: SpeakerTestButtonProps) {
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [blob, setBlob] = useState<Blob | undefined>()

  const handleClick = async () => {
    if (playing) {
      Speaker.stopAudio()
      setPlaying(false)
      return
    }

    try {
      setLoading(true)

      // Load audio blob if not already loaded
      let audioBlob = blob
      if (!audioBlob) {
        const result = await fetch('/test.mp3')
        audioBlob = await result.blob()
      }

      // Play audio
      setPlaying(true)
      setBlob(audioBlob)
      Speaker.playAudio(audioBlob)

      setTimeout(() => {
        setPlaying(false)
      }, 2000)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
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
      {playing ? (
        <FaStop size={14} className="mr-2" />
      ) : (
        <FaPlay size={14} className="mr-2" />
      )}
      Test
    </button>
  )
}
