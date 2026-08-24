import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { CameraTarget } from '../../shared/protocol'
import { worldStore } from '../store/WorldStore'
import { SLOW, damp } from './damp'
import { SUN_DIRECTION, SUN_DISTANCE } from './star'
import { currentEvent, eventShake } from './eventTiming'

/**
 * The camera is the second voice.
 *
 * Flying to the place she is talking about lets her sentences stay very short,
 * which is the whole point: the image asks the question, the words only have to
 * finish it. Between two moves it drifts, so a silence never looks paused.
 */
interface CameraShot {
  radius: number
  phi: number
  theta: number
  /**
   * What the camera aims at. Everything looks at her centre except the shot of
   * her star: the two sit more than eighty degrees apart seen from here, which
   * no reasonable field of view fits, so looking at one means turning away from
   * the other.
   */
  aim?: Vector3
}

const STAR_POINT = new Vector3(...SUN_DIRECTION)
  .normalize()
  .multiplyScalar(SUN_DISTANCE)

const TARGETS: Record<CameraTarget, CameraShot> = {
  whole: { radius: 3.9, phi: 1.35, theta: 0.2 },
  // Her ground sits near 1.07, so this is the one shot whose framing is set by
  // its height above the surface rather than by its distance from the centre:
  // 0.78 of clearance, which is twice what it was.
  surface: { radius: 1.85, phi: 1.58, theta: 0.7 },
  sky: { radius: 2.0, phi: 0.72, theta: -0.4 },
  night: { radius: 3.0, phi: 1.42, theta: Math.PI },
  far: { radius: 6.8, phi: 1.15, theta: 0.35 },
  star: { radius: 4.5, phi: 1.37, theta: -0.41, aim: STAR_POINT },
}

const ORIGIN = new Vector3()

/**
 * Where she is looked at from is read off the store every frame, like every
 * other thing the scene reacts to.
 *
 * Handed down as a prop it would be the one value able to re-render the canvas,
 * and React Three Fiber answers a re-render of the canvas by applying its props
 * again, resolution included. With no resolution of its own to apply it falls
 * back to the density of the screen, which on a dense one is close to twice the
 * pixels Resolution had settled on, arriving at the exact moment the camera
 * flies in and the frame is at its most expensive.
 */
export default function CameraRig() {
  const { camera, gl } = useThree()
  const current = useRef({ radius: 6.8, phi: 1.15, theta: 0.35 })
  const drag = useRef({ theta: 0, phi: 0 })
  const drift = useRef(0)
  const lookTarget = useMemo(() => new Vector3(), [])

  // A light manual orbit, so the planet feels like an object and not a video.
  useEffect(() => {
    const element = gl.domElement
    let pointerId: number | undefined
    let lastX = 0
    let lastY = 0

    const handlePointerDown = (event: PointerEvent) => {
      pointerId = event.pointerId
      lastX = event.clientX
      lastY = event.clientY
      element.setPointerCapture(event.pointerId)
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return
      drag.current.theta -= (event.clientX - lastX) * 0.005
      drag.current.phi = Math.max(
        -1.1,
        Math.min(1.1, drag.current.phi - (event.clientY - lastY) * 0.005)
      )
      lastX = event.clientX
      lastY = event.clientY
    }
    const handlePointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return
      pointerId = undefined
      element.releasePointerCapture(event.pointerId)
    }

    element.addEventListener('pointerdown', handlePointerDown)
    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerup', handlePointerUp)
    element.addEventListener('pointercancel', handlePointerUp)
    return () => {
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [gl])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const look: CameraTarget = worldStore.getSnapshot().look
    const target = TARGETS[look] ?? TARGETS.whole
    drift.current += dt * 0.018

    const state = current.current
    state.radius = damp(state.radius, target.radius, SLOW, dt)
    state.phi = damp(state.phi, target.phi + drag.current.phi, SLOW, dt)
    state.theta = damp(
      state.theta,
      target.theta + drag.current.theta + drift.current,
      SLOW,
      dt
    )

    // Only a catastrophe shakes her, and it shakes her by moving the eye.
    // Everything near jumps and everything far stays put, so a tremor of a few
    // hundredths of a unit reads as the ground moving rather than as the frame
    // being rattled. That is also why an ordinary gesture no longer does it:
    // trembling on every single thing she was asked to do made the whole world
    // feel unstable instead of making a meteor feel violent.
    const jolt = eventShake(currentEvent()) * 0.06
    camera.position.set(
      Math.sin(state.phi) * Math.cos(state.theta) * state.radius +
        (Math.random() - 0.5) * jolt,
      Math.cos(state.phi) * state.radius + (Math.random() - 0.5) * jolt,
      Math.sin(state.phi) * Math.sin(state.theta) * state.radius
    )
    const aim = target.aim ?? ORIGIN
    lookTarget.lerp(aim, 1 - Math.exp(-SLOW * dt))
    camera.lookAt(lookTarget)
  })

  return null
}
