import { Canvas } from '@react-three/fiber'
import CameraRig from './CameraRig'
import Creatures from './Creatures'
import Moons from './Moons'
import Planet from './Planet'
import Resolution, { DENSE_SCREEN } from './Resolution'
import Rings from './Rings'
import Starfield from './Starfield'
import Sun from './Sun'
import Voice from './Voice'

/**
 * Multisampling only earns its cost where a physical pixel is bigger than the
 * jaggedness it hides, and nothing here writes to a stencil. Fixed rather than
 * inline, so a re-render never looks like a request for a new context.
 */
const CONTEXT = {
  antialias: !DENSE_SCREEN,
  stencil: false,
  powerPreference: 'high-performance' as const,
}

/**
 * Fixed for the same reason as the context, and for a stronger one: this
 * component renders once and never again. Nothing in here reads React state,
 * every piece of the scene reads the store inside its own frame loop, so the
 * canvas is configured a single time and Resolution keeps the last word on how
 * many pixels the world is drawn at.
 */
const CAMERA = {
  position: [0, 1, 6.8] as [number, number, number],
  fov: 42,
  near: 0.01,
  far: 120,
}

/**
 * The whole scene. It reads from the store and nothing else, which is why the
 * live experience and the test page can mount exactly this component.
 *
 * How many pixels it is drawn at is left to Resolution, which measures the
 * machine instead of guessing at it.
 */
export default function WorldScene() {
  return (
    <Canvas camera={CAMERA} gl={CONTEXT}>
      <color attach="background" args={['#05050b']} />
      <Starfield />
      <Sun />
      <Planet />
      <Voice />
      <Creatures />
      <Rings />
      <Moons />
      <CameraRig />
      <Resolution />
    </Canvas>
  )
}
