import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Mesh,
  ShaderMaterial,
} from 'three'
import { worldStore } from '../store/WorldStore'
import { MEDIUM, damp } from './damp'
import { paletteOf } from './palette'
import { NOISE_GLSL } from './shaders/noise'

/** Banded dust, faded in and out so the tool call reads as a slow arrival. */
export default function Rings() {
  const mesh = useRef<Mesh>(null)
  const shown = useRef(0)

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uOpacity: { value: 0 },
          uColor: { value: new Color('#ffcf8a') },
          uSeed: { value: 1 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vLocal;
          void main() {
            vUv = uv;
            vLocal = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          ${NOISE_GLSL}
          uniform float uOpacity;
          uniform float uSeed;
          uniform vec3 uColor;
          varying vec3 vLocal;
          void main() {
            float radius = length(vLocal.xy);
            float t = smoothstep(1.35, 2.4, radius);
            float bands = 0.5 + 0.5 * sin(radius * 42.0 + snoise(vec3(radius * 6.0, uSeed, 0.0)) * 4.0);
            float edges = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.82, 1.0, t));
            gl_FragColor = vec4(uColor, bands * edges * uOpacity * 0.55);
            #include <colorspace_fragment>
          }
        `,
      }),
    []
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const world = worldStore.world()
    shown.current = damp(shown.current, world.rings ? 1 : 0, MEDIUM * 0.5, dt)
    material.uniforms.uOpacity.value = shown.current
    material.uniforms.uSeed.value = world.seed
    material.uniforms.uColor.value.lerp(paletteOf(world.palette).star, 0.02)
    if (mesh.current) mesh.current.visible = shown.current > 0.01
  })

  return (
    <mesh ref={mesh} material={material} rotation={[Math.PI / 2.35, 0, 0.4]}>
      <ringGeometry args={[1.35, 2.4, 160, 1]} />
    </mesh>
  )
}
