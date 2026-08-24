import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  MeshStandardMaterial,
  Points,
  PointsMaterial,
  Vector3,
} from 'three'
import { createAsteroid } from './asteroid'
import {
  METEOR_IMPACT,
  METEOR_IMPACT_DIR,
  METEOR_START,
  currentEvent,
} from './eventTiming'

/**
 * The scripted part of a catastrophe, minus the shockwave, which is drawn on
 * her surface by Shockwave. Everything here is animation code driven by one
 * number, so a crisis that runs for twenty seconds on screen costs a single
 * tool call and nothing else.
 */
export default function EventFx() {
  const rock = useRef<Mesh>(null)
  const ejecta = useRef<Points>(null)

  const start = useMemo(() => new Vector3(...METEOR_START), [])
  const impact = useMemo(() => new Vector3(...METEOR_IMPACT_DIR).normalize(), [])

  const { ejectaGeometry, ejectaMaterial, directions } = useMemo(() => {
    const count = 220
    const positions = new Float32Array(count * 3)
    const directions: Vector3[] = []
    for (let i = 0; i < count; i++) {
      directions.push(
        new Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize()
      )
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    return {
      ejectaGeometry: geometry,
      ejectaMaterial: new PointsMaterial({
        size: 0.03,
        color: '#ffb057',
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
      directions,
    }
  }, [])

  // The thing that hits her is a rock, not a bead: same generator as her moons.
  const shape = useMemo(() => createAsteroid(4242), [])
  const rockMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        // Rock, the same grey as her moons. It is a stone falling, not a
        // firework: the heat only shows in the last moments of the approach.
        color: '#8e8781',
        roughness: 1,
        flatShading: true,
        emissive: new Color('#ff7a34'),
        emissiveIntensity: 0,
      }),
    []
  )

  useFrame(() => {
    const event = currentEvent()
    const progress = event?.progress ?? 0
    const meteor = event?.id === 'meteor'
    const eruption = event?.id === 'eruption'

    // The rock falls over the first third and vanishes into the impact,
    // tumbling and heating up on the way in.
    if (rock.current) {
      const fall = meteor ? Math.min(1, progress / METEOR_IMPACT) : 1
      rock.current.visible = meteor && fall < 1
      rock.current.position.lerpVectors(
        start,
        impact.clone().multiplyScalar(1.02),
        fall
      )
      const size = 0.085 * (1 + fall * 1.1)
      rock.current.scale.set(
        size * shape.stretch[0],
        size * shape.stretch[1],
        size * shape.stretch[2]
      )
      rock.current.rotateOnAxis(shape.spin, 0.06)
      rockMaterial.emissiveIntensity =
        Math.max(0, (fall - 0.82) / 0.18) * 1.1
    }

    // Eruptions throw pieces of her into the sky and they fall back.
    if (ejecta.current) {
      const t = eruption ? progress : 0
      ejecta.current.visible = t > 0 && t < 1
      ejectaMaterial.opacity = Math.max(0, Math.sin(t * Math.PI)) * 0.9
      if (t > 0) {
        const array = ejectaGeometry.attributes.position.array as Float32Array
        const height = 1.02 + Math.sin(t * Math.PI) * 0.45
        for (let i = 0; i < directions.length; i++) {
          const spread = 1 + (i % 7) * 0.02
          array[i * 3] = directions[i].x * height * spread
          array[i * 3 + 1] = directions[i].y * height * spread
          array[i * 3 + 2] = directions[i].z * height * spread
        }
        ejectaGeometry.attributes.position.needsUpdate = true
      }
    }
  })

  return (
    <>
      <mesh
        ref={rock}
        geometry={shape.geometry}
        material={rockMaterial}
        visible={false}
      />
      <points ref={ejecta} geometry={ejectaGeometry} material={ejectaMaterial} visible={false} />
    </>
  )
}
