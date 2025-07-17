import { Speaker } from '@micdrop/client'
import React, { useEffect, useRef, useState } from 'react'
import { FaPlay, FaStop } from 'react-icons/fa'

interface SpeakerTestButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function SpeakerTestButton(props: SpeakerTestButtonProps) {
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const timeoutRef = useRef<number | undefined>()

  useEffect(() => {
    const onStartPlaying = () => setPlaying(true)
    const onStopPlaying = () => setPlaying(false)
    Speaker.on('StartPlaying', onStartPlaying)
    Speaker.on('StopPlaying', onStopPlaying)
    return () => {
      Speaker.off('StartPlaying', onStartPlaying)
      Speaker.off('StopPlaying', onStopPlaying)
    }
  }, [])

  const handleClick = async () => {
    clearTimeout(timeoutRef.current)

    if (Speaker.isPlaying) {
      Speaker.stopAudio()
      return
    }

    setLoading(true)

    const filepathPattern = '/chunk-{i}.webm'
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
      {playing ? (
        <FaStop size={14} className="mr-2" />
      ) : (
        <FaPlay size={14} className="mr-2" />
      )}
      Test
    </button>
  )
}
