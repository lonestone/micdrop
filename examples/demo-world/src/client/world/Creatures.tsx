import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three'
import { worldStore } from '../store/WorldStore'
import { MEDIUM, damp } from './damp'
import { peakRadius } from './scale'
import { SUN_DIRECTION } from './star'

const FLOCKS = 34
const MEMBERS = 16
/** Each animal drags a few dimmer copies of itself behind it. */
const TRAIL = 5
const COUNT = FLOCKS * MEMBERS * TRAIL

/**
 * The proof that she is not alone, and the thing that used to be invisible.
 *
 * Scattered evenly they read as sensor noise, so they travel in flocks along
 * great circles, each animal trailing a short comet of itself. A moving group
 * with a wake is legible at planet scale in a way a static speck never is, and
 * legibility is the entire job: "quelque chose bouge tout seul" has to be
 * something you notice without being told to look.
 *
 * Nothing here is computed on the processor. The whole migration is one
 * rotation per vertex about an axis the flock was born with, which means the
 * count can be in the thousands and the frame cost stays where it was.
 */
export default function Creatures() {
  const points = useRef<Points>(null)
  const shown = useRef(0)

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const axes = new Float32Array(COUNT * 3)
    const speeds = new Float32Array(COUNT)
    const trails = new Float32Array(COUNT)
    const ranks = new Float32Array(COUNT)

    let index = 0
    for (let flock = 0; flock < FLOCKS; flock++) {
      // One anchor per flock, spread evenly over the sphere, and one axis and
      // speed shared by everyone in it so the group holds together.
      const y = 1 - (flock / (FLOCKS - 1)) * 2
      const radius = Math.sqrt(Math.max(0, 1 - y * y))
      const angle = flock * 2.399963
      const anchor = new Vector3(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      )
      const axis = new Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize()
      const speed = 0.16 + Math.random() * 0.26
      // Flocks appear in order, so a trickle of life is a few herds crossing
      // her rather than a faint dusting over the whole globe.
      const rank = flock / FLOCKS

      for (let member = 0; member < MEMBERS; member++) {
        const spread = new Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).multiplyScalar(0.085)
        const base = anchor.clone().add(spread).normalize().multiplyScalar(1.035)

        for (let tail = 0; tail < TRAIL; tail++) {
          positions[index * 3] = base.x
          positions[index * 3 + 1] = base.y
          positions[index * 3 + 2] = base.z
          axes[index * 3] = axis.x
          axes[index * 3 + 1] = axis.y
          axes[index * 3 + 2] = axis.z
          speeds[index] = speed
          trails[index] = tail / TRAIL
          ranks[index] = rank
          index++
        }
      }
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aAxis', new BufferAttribute(axes, 3))
    geometry.setAttribute('aSpeed', new BufferAttribute(speeds, 1))
    geometry.setAttribute('aTrail', new BufferAttribute(trails, 1))
    geometry.setAttribute('aRank', new BufferAttribute(ranks, 1))

    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      // Additive, because on her night side these are the only things making
      // their own light and they should read as such.
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uDensity: { value: 0 },
        uSize: { value: 15 },
        // Held just above the tallest peak the relief can reach, so a herd
        // never wades through a mountain.
        uRadius: { value: 1.06 },
        uSunDir: { value: new Vector3(...SUN_DIRECTION).normalize() },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uOpacity;
        uniform float uDensity;
        uniform float uSize;
        uniform float uRadius;
        uniform vec3 uSunDir;

        attribute vec3 aAxis;
        attribute float aSpeed;
        attribute float aTrail;
        attribute float aRank;

        varying float vAlpha;
        varying float vLit;

        /** Rodrigues, which is the whole migration. */
        vec3 turn(vec3 v, vec3 axis, float angle) {
          float c = cos(angle);
          float s = sin(angle);
          return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
        }

        void main() {
          // Herds arrive in order, so half a world of animals is half of them
          // present rather than all of them at half brightness.
          float present = step(aRank, uDensity);

          float angle = uTime * aSpeed - aTrail * 0.016;
          vec3 world = turn(normalize(position), aAxis, angle) * uRadius;

          vLit = smoothstep(-0.25, 0.45, dot(normalize(world), uSunDir));
          // The head is the animal, the rest is where it has just been.
          float fade = 1.0 - aTrail * 0.92;
          vAlpha = uOpacity * present * fade;

          vec4 mvPosition = modelViewMatrix * vec4(world, 1.0);
          gl_PointSize = clamp(uSize * fade / max(0.001, -mvPosition.z), 1.0, 20.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        varying float vLit;

        void main() {
          if (vAlpha < 0.01) discard;
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float core = smoothstep(1.0, 0.0, d);
          float alpha = vAlpha * core * core;
          if (alpha < 0.01) discard;

          // Lit by her star on the day side, lit by themselves on the night
          // one, which is what keeps a herd readable all the way round.
          vec3 day = vec3(1.0, 0.86, 0.55);
          vec3 dark = vec3(0.35, 1.0, 0.72);
          vec3 color = mix(dark, day, vLit);

          gl_FragColor = vec4(color, alpha);
            #include <colorspace_fragment>
        }
      `,
    })

    return { geometry, material }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const world = worldStore.world()
    shown.current = damp(shown.current, world.creatures, MEDIUM * 0.5, dt)

    const uniforms = material.uniforms
    uniforms.uTime.value += dt
    uniforms.uOpacity.value = Math.min(0.85, shown.current * 1.3)
    uniforms.uDensity.value = Math.min(1, shown.current * 1.4)
    uniforms.uRadius.value = peakRadius(world.roughness) + 0.012

    if (points.current) points.current.visible = shown.current > 0.015
  })

  return <points ref={points} geometry={geometry} material={material} />
}
