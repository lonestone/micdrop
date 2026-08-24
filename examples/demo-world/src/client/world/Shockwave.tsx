import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Mesh, ShaderMaterial, Vector3 } from 'three'
import { worldStore } from '../store/WorldStore'
import { METEOR_IMPACT, METEOR_IMPACT_DIR, currentEvent } from './eventTiming'
import { createShellGeometry } from './geometry'
import { waveRadius } from './scale'

/**
 * The wound, drawn on her skin rather than in front of it.
 *
 * The shell sits above the highest peaks the displacement can reach (see
 * scale.ts), otherwise the wave is depth rejected by her own mountains and
 * never shows.
 *
 * A shell just above the ground, shaded by the angular distance to the impact
 * point, so the wave wraps around the curve of the planet instead of being a
 * flat disc floating through it. It lives inside her group, which means the
 * scar stays where it landed while she keeps turning.
 */
export default function Shockwave() {
  const mesh = useRef<Mesh>(null)
  const geometry = useMemo(() => createShellGeometry(1.012), [])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uProgress: { value: 0 },
          uImpact: { value: new Vector3(...METEOR_IMPACT_DIR).normalize() },
        },
        vertexShader: /* glsl */ `
          varying vec3 vUnit;
          void main() {
            vUnit = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uProgress;
          uniform vec3 uImpact;
          varying vec3 vUnit;

          void main() {
            float t = clamp((uProgress - ${METEOR_IMPACT.toFixed(2)}) / ${(1 - METEOR_IMPACT).toFixed(2)}, 0.0, 1.0);
            if (t <= 0.0) discard;

            // Angular distance to the impact, so the front travels along the
            // surface at a constant speed however curved she is.
            float angle = acos(clamp(dot(normalize(vUnit), normalize(uImpact)), -1.0, 1.0));

            // Slow enough that the front stays on the face she is showing for
            // most of the animation instead of racing over the horizon.
            float front = t * 1.9;
            float d = angle - front;

            // Squared by multiplication, never by pow: pow with a negative base
            // is undefined in GLSL, and d is signed either side of the front,
            // which yields NaN and a wave that never appears.
            float core = d / 0.05;
            float halo = d / 0.22;
            float crest = exp(-core * core);
            float glow = exp(-halo * halo) * 0.45;

            // The ground it has already crossed stays scorched for a while.
            float scorch = smoothstep(0.0, -0.55, d) * 0.18 * (1.0 - t);

            float ft = t / 0.06;
            float fa = angle / 0.16;
            float flash = exp(-ft * ft) * exp(-fa * fa);
            float fade = 1.0 - t * t;

            vec3 color = mix(vec3(1.0, 0.42, 0.12), vec3(1.0, 0.95, 0.85), crest);
            float alpha = (crest * 1.5 + glow + scorch) * fade + flash * 2.0;

            if (alpha < 0.004) discard;
            gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
            #include <colorspace_fragment>
          }
        `,
      }),
    []
  )

  useFrame(() => {
    const event = currentEvent()
    const playing = event?.id === 'meteor'
    if (mesh.current) {
      mesh.current.visible = playing
      // Between the summits and the clouds, whatever the relief is doing.
      mesh.current.scale.setScalar(waveRadius(worldStore.world().roughness))
    }
    if (playing) material.uniforms.uProgress.value = event.progress
  })

  return (
    <mesh ref={mesh} geometry={geometry} material={material} visible={false} />
  )
}
