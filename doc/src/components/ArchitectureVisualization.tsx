import { useEffect, useRef, useState } from 'react'

interface ArchitectureBlock {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  color: string
  flashColor?: string
}

interface Particle {
  id: number
  progress: number
  active: boolean
  type: 'audio' | 'message' | 'message_chunk'
  size: number
}

interface Connection {
  from: string
  to: string
  path: string
  particles: Particle[]
}

const WIDTH = 800
const HEIGHT = 250
const PADDING = 10

const micBlock = {
  id: 'microphone',
  label: '🎙️ Mic',
  x: 100 / 2 + PADDING,
  y: HEIGHT * 0.3,
  width: 100,
  height: 40,
  color: '#715603',
  flashColor: '#EAB308',
}
const speakerBlock = {
  id: 'speaker',
  label: '🔈 Speaker',
  x: 100 / 2 + PADDING,
  y: HEIGHT * 0.7,
  width: 100,
  height: 40,
  color: '#715603',
  flashColor: '#EAB308',
}
const clientBlock = {
  id: 'client',
  label: 'Client',
  x: WIDTH * 0.33,
  y: HEIGHT * 0.5,
  width: 120,
  height: 60,
  color: '#10B981',
}
const serverBlock = {
  id: 'server',
  label: 'Server',
  x: WIDTH * 0.66,
  y: HEIGHT * 0.5,
  width: 120,
  height: 60,
  color: '#10B981',
}
const sttBlock = {
  id: 'stt',
  label: 'STT',
  x: WIDTH - 80 / 2 - PADDING,
  y: 40 / 2 + PADDING,
  width: 80,
  height: 40,
  color: '#133976',
  flashColor: '#3B82F6',
}
const agentBlock = {
  id: 'agent',
  label: 'Agent',
  x: WIDTH - 80 / 2 - PADDING,
  y: HEIGHT * 0.5,
  width: 80,
  height: 40,
  color: '#133976',
  flashColor: '#3B82F6',
}
const ttsBlock = {
  id: 'tts',
  label: 'TTS',
  x: WIDTH - 80 / 2 - PADDING,
  y: HEIGHT - 40 / 2 - PADDING,
  width: 80,
  height: 40,
  color: '#133976',
  flashColor: '#3B82F6',
}

const architectureBlocks: ArchitectureBlock[] = [
  micBlock,
  speakerBlock,
  clientBlock,
  serverBlock,
  sttBlock,
  agentBlock,
  ttsBlock,
]

const connections: Connection[] = [
  {
    from: 'microphone',
    to: 'client',
    path: `M ${micBlock.x} ${micBlock.y} L ${clientBlock.x} ${clientBlock.y}`,
    particles: [],
  },
  {
    from: 'client',
    to: 'server',
    path: `M ${clientBlock.x} ${clientBlock.y} L ${serverBlock.x} ${serverBlock.y}`,
    particles: [],
  },
  {
    from: 'server',
    to: 'stt',
    path: `M ${serverBlock.x} ${serverBlock.y} L ${sttBlock.x} ${sttBlock.y}`,
    particles: [],
  },
  {
    from: 'stt',
    to: 'server',
    path: `M ${sttBlock.x} ${sttBlock.y} L ${serverBlock.x} ${serverBlock.y}`,
    particles: [],
  },
  {
    from: 'server',
    to: 'agent',
    path: `M ${serverBlock.x} ${serverBlock.y} L ${agentBlock.x} ${agentBlock.y}`,
    particles: [],
  },
  {
    from: 'agent',
    to: 'server',
    path: `M ${agentBlock.x} ${agentBlock.y} L ${serverBlock.x} ${serverBlock.y}`,
    particles: [],
  },
  {
    from: 'server',
    to: 'tts',
    path: `M ${serverBlock.x} ${serverBlock.y} L ${ttsBlock.x} ${ttsBlock.y}`,
    particles: [],
  },
  {
    from: 'server',
    to: 'client',
    path: `M ${serverBlock.x} ${serverBlock.y} L ${clientBlock.x} ${clientBlock.y}`,
    particles: [],
  },
  {
    from: 'tts',
    to: 'server',
    path: `M ${ttsBlock.x} ${ttsBlock.y} L ${serverBlock.x} ${serverBlock.y}`,
    particles: [],
  },
  {
    from: 'client',
    to: 'speaker',
    path: `M ${clientBlock.x} ${clientBlock.y} L ${speakerBlock.x} ${speakerBlock.y}`,
    particles: [],
  },
]

export function ArchitectureVisualization() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [, forceUpdate] = useState({})
  const [flashingBlocks, setFlashingBlocks] = useState(new Set<string>())
  const animationRef = useRef<number>()
  const flashTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Helper function to trigger flash for a block
  const triggerFlash = (blockId: string) => {
    setFlashingBlocks((prev) => new Set(prev).add(blockId))

    const existingTimeout = flashTimeoutRefs.current.get(blockId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    const timeout = setTimeout(() => {
      setFlashingBlocks((prev) => {
        const newSet = new Set(prev)
        newSet.delete(blockId)
        return newSet
      })
      flashTimeoutRefs.current.delete(blockId)
    }, 200)

    flashTimeoutRefs.current.set(blockId, timeout)
  }

  useEffect(() => {
    let sequenceTimer = 0
    let particleIdCounter = 0
    const addedParticles = new Set<string>()

    const flowSequence = [
      // 4 audio chunks: microphone → client
      { connection: 0, count: 4, type: 'audio', delay: 0 },
      // 4 audio chunks: client → server
      { connection: 1, count: 4, type: 'audio', delay: 700 },
      // 4 audio chunks: server → stt
      { connection: 2, count: 4, type: 'audio', delay: 1500 },
      // 5 message chunks: stt → server
      { connection: 3, count: 5, type: 'message_chunk', delay: 2200 },
      // 1 message: server → agent
      { connection: 4, count: 1, type: 'message', delay: 3400 },
      // 7 message chunks: agent → server
      { connection: 5, count: 7, type: 'message_chunk', delay: 4400 },
      // 7 message chunks: server → tts
      { connection: 6, count: 7, type: 'message_chunk', delay: 5000 },
      // 1 message: server → client
      { connection: 7, count: 1, type: 'message', delay: 5900 },
      // 5 audio chunks: tts → server
      { connection: 8, count: 5, type: 'audio', delay: 5600 },
      // 5 audio chunks: server → client
      { connection: 7, count: 5, type: 'audio', delay: 6700 },
      // 5 audio chunks: client → speaker
      { connection: 9, count: 5, type: 'audio', delay: 7300 },
    ]

    const animate = () => {
      sequenceTimer += 16 // ~60fps

      // Add particles according to sequence
      flowSequence.forEach((flow, index) => {
        if (
          sequenceTimer >= flow.delay &&
          sequenceTimer < flow.delay + flow.count * 150
        ) {
          const particleIndex = Math.floor((sequenceTimer - flow.delay) / 150)
          const particleKey = `${index}-${particleIndex}`
          if (particleIndex < flow.count && !addedParticles.has(particleKey)) {
            addedParticles.add(particleKey)
            connections[flow.connection].particles.push({
              id: particleIdCounter++,
              progress: 0,
              active: true,
              type: flow.type as 'audio' | 'message' | 'message_chunk',
              size: flow.type === 'message' ? 12 : 6,
            })

            // Flash microphone when particles are emitted from microphone to client (connection 0)
            if (flow.connection === 0) {
              triggerFlash('microphone')
            }
          }
        }
      })

      // Reset sequence every 10 seconds
      if (sequenceTimer >= 10000) {
        sequenceTimer = 0
        addedParticles.clear()
        connections.forEach((conn) => (conn.particles = []))
      }

      // Update particle positions
      let hasChanges = false
      connections.forEach((connection, connectionIndex) => {
        connection.particles.forEach((particle) => {
          if (particle.active) {
            particle.progress += 0.015
            hasChanges = true
            if (particle.progress >= 0.9 && particle.active) {
              particle.active = false

              // Flash blocks when particles arrive
              if (connectionIndex === 2) {
                // server → stt (connection 2)
                triggerFlash('stt')
              } else if (connectionIndex === 4) {
                // server → agent (connection 4)
                triggerFlash('agent')
              } else if (connectionIndex === 6) {
                // server → tts (connection 6)
                triggerFlash('tts')
              } else if (connectionIndex === 9) {
                // client → speaker (connection 9)
                triggerFlash('speaker')
              }
            }
          }
        })

        // Clean up inactive particles
        const beforeCount = connection.particles.length
        connection.particles = connection.particles.filter((p) => p.active)
        if (connection.particles.length !== beforeCount) {
          hasChanges = true
        }
      })

      // Force re-render only when there are visual changes
      if (hasChanges) {
        forceUpdate({})
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="w-full bg-transparent rounded-xl overflow-hidden relative">
      <svg
        ref={svgRef}
        className="w-full"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Particle glow filter */}
          <filter
            id="particle-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines */}
        {connections.map((connection) => (
          <g key={`connection-${connection.from}-${connection.to}`}>
            {/* Connection line */}
            <path
              d={connection.path}
              stroke="#6C799051"
              strokeWidth="3"
              fill="none"
              opacity="0.8"
            />

            {/* Animated particles */}
            {connection.particles.map((particle) => {
              const pathElement = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
              )
              pathElement.setAttribute('d', connection.path)
              const pathLength = pathElement.getTotalLength?.() || 100
              const point = pathElement.getPointAtLength?.(
                particle.progress * pathLength
              ) || { x: 0, y: 0 }

              return (
                <circle
                  key={particle.id}
                  cx={point.x}
                  cy={point.y}
                  r={particle.size}
                  fill={
                    particle.type === 'message' ||
                    particle.type === 'message_chunk'
                      ? '#3B82F6'
                      : '#EAB308'
                  }
                  filter="url(#particle-glow)"
                />
              )
            })}
          </g>
        ))}

        {/* Architecture blocks */}
        {architectureBlocks.map((block) => {
          const isFlashing = flashingBlocks.has(block.id)
          const blockColor =
            isFlashing && block.flashColor ? block.flashColor : block.color

          return (
            <g key={block.id}>
              {/* Main block */}
              <rect
                x={block.x - block.width / 2}
                y={block.y - block.height / 2}
                width={block.width}
                height={block.height}
                rx="8"
                fill={blockColor}
                className="transition-all duration-200"
              />

              {/* Block label */}
              <text
                x={block.x}
                y={block.y + 5}
                textAnchor="middle"
                className="fill-white font-bold text-sm pointer-events-none"
                style={{ fontSize: '14px' }}
              >
                {block.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 text-xs text-ai-surface-600 dark:text-ai-surface-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Audio</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Message chunks</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Messages</span>
          </div>
        </div>
      </div>
    </div>
  )
}
