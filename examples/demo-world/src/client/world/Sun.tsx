import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  DirectionalLight,
  Mesh,
  ShaderMaterial,
  Vector3,
} from 'three'
import { worldStore } from '../store/WorldStore'
import { MEDIUM, damp } from './damp'
import { currentEvent } from './eventTiming'
import { paletteOf } from './palette'
import { NOISE_GLSL } from './shaders/noise'
import { SUN_DIRECTION, SUN_DISTANCE } from './star'

/**
 * Her star, and the source of the only light in the scene.
 *
 * A flat disc reads as a sticker, so this is a billboard carrying three
 * things a star actually has: a granulated photosphere that boils, a corona
 * whose rays turn, and a bloom that bleeds into the black around it. A flare
 * simply drives all three at once.
 */
export default function Sun() {
  const light = useRef<DirectionalLight>(null)
  const disc = useRef<Mesh>(null)
  const intensity = useRef(1.4)
  const shownFlare = useRef(0)

  const direction = useMemo(() => new Vector3(...SUN_DIRECTION).normalize(), [])
  const position = useMemo(
    () => direction.clone().multiplyScalar(SUN_DISTANCE),
    [direction]
  )

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new Color('#ffcf8a') },
          uFlare: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          ${NOISE_GLSL}

          uniform float uTime;
          uniform float uFlare;
          uniform vec3 uColor;
          varying vec2 vUv;

          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            float r = length(p);
            if (r > 1.0) discard;

            float angle = atan(p.y, p.x);

            // The disc is a tenth of the quad it is drawn on, and the boil
            // only ever shows on the disc, so the corona around it is spared
            // the octaves entirely.
            float body = smoothstep(0.30, 0.262, r);
            float grain = 0.0;
            if (body > 0.0) {
              // The photosphere boils rather than sitting still.
              grain = fbm(vec3(p * 9.0, uTime * 0.15), 5, 2.1, 0.55);
            }

            // Limb darkening: a star is a ball of gas, so its edge is cooler
            // and redder than its middle. Without it the disc reads as a decal.
            float rr = min(1.0, r / 0.30);
            float limb = sqrt(max(0.0, 1.0 - rr * rr));

            // Rays sampled around a circle, so they wrap without a seam. Out
            // past the corona's own falloff they modulate a value already near
            // zero, so the sampling stops there.
            float rays = 0.5;
            if (r < 0.88) {
              rays = 0.5 + 0.5 * fbm(
                vec3(cos(angle) * 2.6, sin(angle) * 2.6, uTime * 0.22), 3, 2.1, 0.55
              );
            }
            float corona = pow(max(0.0, 1.0 - r), 2.1) * (0.12 + 0.88 * rays);
            float bloom = exp(-r * 3.4);

            vec3 hot = vec3(1.0, 0.97, 0.90);
            vec3 surface = mix(uColor * 0.85, hot, 0.25 + 0.65 * limb + grain * 0.25);
            vec3 color = mix(uColor, surface, body);

            float alpha = body * (0.8 + grain * 0.2)
                        + corona * (0.42 + uFlare)
                        + bloom * (0.3 + uFlare * 0.8);

            gl_FragColor = vec4(color * (1.0 + uFlare * 0.6), clamp(alpha, 0.0, 1.0));
            #include <colorspace_fragment>
          }
        `,
      }),
    []
  )

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.1)
    const world = worldStore.world()

    const event = currentEvent()
    const flare =
      event?.id === 'flare'
        ? Math.sin(Math.min(1, event.progress) * Math.PI)
        : 0
    shownFlare.current = damp(shownFlare.current, flare, MEDIUM, dt)

    intensity.current = damp(intensity.current, 1.4 + flare * 2.6, MEDIUM, dt)
    if (light.current) light.current.intensity = intensity.current

    material.uniforms.uTime.value += dt
    material.uniforms.uFlare.value = shownFlare.current
    material.uniforms.uColor.value.lerp(
      paletteOf(world.palette).star,
      1 - Math.exp(-MEDIUM * dt)
    )

    if (disc.current) {
      // Always face the eye, and breathe a little so it never looks printed on.
      disc.current.quaternion.copy(frame.camera.quaternion)
      const pulse = 1 + Math.sin(material.uniforms.uTime.value * 0.6) * 0.02
      disc.current.scale.setScalar(pulse * (1 + shownFlare.current * 0.55))
    }
  })

  return (
    <>
      <directionalLight ref={light} position={position} intensity={1.4} />
      <ambientLight intensity={0.08} />
      <mesh ref={disc} position={position} material={material}>
        <planeGeometry args={[9, 9]} />
      </mesh>
    </>
  )
}
