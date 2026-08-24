import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Group, Mesh } from 'three'
import { worldStore } from '../store/WorldStore'
import { MEDIUM, damp } from './damp'
import { createMoon } from './moon'

/**
 * Where they ride, and it is the frame that decides.
 *
 * The old orbits reached out to 3.7, further than the radius the wide shot is
 * taken from, so a moon spent most of its time beside the eye or behind it and
 * somebody who had just asked for one saw nothing at all.
 *
 * A moon on a circle of radius R, seen from a camera at C aiming at her centre,
 * stays inside the frame for its whole orbit when R * sqrt(1 + k * k) < k * C,
 * where k is the tangent of the half field of view across the screen. The wide
 * shot is taken from 3.9 with a k near 0.61, which puts the limit at 2.04. The
 * three below sit under it, so a moon that has just arrived is on screen
 * wherever it happens to be on its way round.
 *
 * The inclinations are strong on purpose. A moon on a flat orbit spends half of
 * every turn hidden behind her; a tilted one rides above her disc, against the
 * black, where there is nothing to lose it in.
 */
const ORBITS = [
  { radius: 1.6, speed: 0.2, size: 0.15, tilt: 0.55 },
  { radius: 1.9, speed: 0.14, size: 0.2, tilt: -0.7 },
  { radius: 2.2, speed: 0.1, size: 0.12, tilt: 0.4 },
]

/** Up to three companions, each a world of its own on its own tilted orbit. */
export default function Moons() {
  const groups = useRef<(Group | null)[]>([])
  const rocks = useRef<(Mesh | null)[]>([])
  const shown = useRef([0, 0, 0])
  const time = useRef(0)
  const orbits = useMemo(() => ORBITS, [])
  const shapes = useMemo(() => ORBITS.map((_, index) => createMoon(index)), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    time.current += dt
    const world = worldStore.world()

    orbits.forEach((orbit, index) => {
      const target = index < world.moons ? 1 : 0
      shown.current[index] = damp(
        shown.current[index],
        target,
        MEDIUM * 0.4,
        dt
      )
      const group = groups.current[index]
      if (!group) return
      const scale = shown.current[index]
      group.visible = scale > 0.02
      group.scale.setScalar(scale)
      const angle = time.current * orbit.speed + index * 2.1
      group.position.set(
        Math.cos(angle) * orbit.radius,
        Math.sin(angle) * orbit.radius * orbit.tilt,
        Math.sin(angle) * orbit.radius
      )
      // Tumbling around its own axis rather than spinning politely about Y.
      const rock = rocks.current[index]
      if (rock) {
        const spin = shapes[index].spin
        rock.rotateOnAxis(spin, dt * spin.length())
      }
    })
  })

  return (
    <>
      {orbits.map((orbit, index) => (
        <group
          key={index}
          ref={(element) => {
            groups.current[index] = element
          }}
        >
          <mesh
            ref={(element) => {
              rocks.current[index] = element
            }}
            geometry={shapes[index].geometry}
            scale={[
              orbit.size * shapes[index].stretch[0],
              orbit.size * shapes[index].stretch[1],
              orbit.size * shapes[index].stretch[2],
            ]}
          >
            {/* Smooth, not faceted: the craters are cut into the mesh, and flat
                shading turned them into a field of triangles. */}
            <meshStandardMaterial color={shapes[index].color} roughness={0.95} />
          </mesh>
        </group>
      ))}
    </>
  )
}
