import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Mesh, ShaderMaterial, Vector3 } from 'three'
import { worldStore } from '../store/WorldStore'
import { MEDIUM, damp } from './damp'
import { createShellGeometry } from './geometry'
import { cloudRadius } from './scale'
import { NOISE_GLSL } from './shaders/noise'
import { SUN_DIRECTION } from './star'

/**
 * The lights over her poles.
 *
 * Three things separate an aurora from a cloud, and the first matters most: it
 * is an oval around the magnetic pole, not a cap over it, so there is dark sky
 * between the ring and the pole itself. Then it is made of ribbons, sharp
 * across their width and long along it, folding as they drift. And it shines by
 * itself, so it burns on her night side, exactly where cloud goes black.
 */
export default function Auroras() {
  const mesh = useRef<Mesh>(null)
  const shown = useRef(0)
  const geometry = useMemo(() => createShellGeometry(), [])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: 1 },
          uStrength: { value: 0 },
          uSunDir: { value: new Vector3(...SUN_DIRECTION).normalize() },
        },
        vertexShader: /* glsl */ `
          varying vec3 vUnit;
          varying vec3 vWorldNormal;
          varying vec3 vViewNormal;
          varying vec3 vViewDir;
          void main() {
            vUnit = normalize(position);
            vWorldNormal = normalize(
              mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * vUnit
            );
            vViewNormal = normalize(normalMatrix * vUnit);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: /* glsl */ `
          ${NOISE_GLSL}

          uniform float uTime;
          uniform float uSeed;
          uniform float uStrength;
          uniform vec3 uSunDir;

          varying vec3 vUnit;
          varying vec3 vWorldNormal;
          varying vec3 vViewNormal;
          varying vec3 vViewDir;

          void main() {
            if (uStrength < 0.01) discard;

            vec3 dir = normalize(vUnit);
            float lat = abs(dir.y);

            // Two thirds of the shell is tropical sky no ribbon ever reaches,
            // and it was running eleven octaves of noise to work that out one
            // pixel at a time. The cut is drawn wide enough that the widest
            // fold the field can produce still falls inside it.
            if (lat < 0.64) discard;

            // The oval sits near sixty-seven degrees. Everything outside a
            // narrow band around it is empty sky, including the pole itself.
            float across = (lat - 0.92) / 0.075;

            // Longitude, drifting slowly the way a real oval does.
            float lon = atan(dir.z, dir.x) + uTime * 0.05 + uSeed;
            vec2 ring = vec2(cos(lon), sin(lon));

            // Folds sampled around the circle, so the pattern wraps with no
            // seam, and at low frequency so the ribbon meanders instead of
            // breaking into blobs.
            float folds = fbm(vec3(ring * 2.6, uTime * 0.1), 4, 2.2, 0.5);
            float wander = across + folds * 1.1;
            float ribbon = exp(-wander * wander * 1.5);

            // Striations run across the ribbon, which is what makes it read as
            // a curtain seen from outside rather than a smear. Two scales, so
            // the rays are not evenly combed.
            float striae = 0.4
              + 0.4 * fbm(vec3(ring * 26.0, uTime * 0.35), 2, 2.0, 0.5)
              + 0.3 * fbm(vec3(ring * 61.0, uTime * 0.5), 2, 2.0, 0.5);

            // An aurora is never evenly bright along its arc: some stretches
            // flare while others go quiet.
            float pulse = 0.25 + 0.95 * smoothstep(
              -0.35, 0.5, fbm(vec3(ring * 1.5, uTime * 0.18), 3, 2.0, 0.5)
            );

            // A wide envelope keeps the ribbon from wandering to the equator.
            float envelope = exp(-across * across * 0.09);

            float intensity = ribbon * striae * pulse * envelope * uStrength;
            if (intensity < 0.004) discard;

            // The colours the sky actually makes: nitrogen magenta under the
            // ribbon, oxygen green through its body, oxygen red at the top.
            float height = clamp(wander * 0.5 + 0.5, 0.0, 1.0);
            vec3 color = mix(vec3(1.0, 0.24, 0.6), vec3(0.15, 1.0, 0.45),
                             smoothstep(0.0, 0.42, height));
            color = mix(color, vec3(0.75, 0.18, 0.7), smoothstep(0.72, 1.0, height));

            // Edge on it is a wall of light, flat on it is a faint veil.
            float grazing = 1.0 - abs(dot(vViewNormal, vViewDir));
            float depth = 0.35 + 1.3 * grazing * grazing;

            // It makes its own light, so daylight only washes it out.
            float lit = smoothstep(-0.35, 0.45, dot(vWorldNormal, uSunDir));
            float night = 1.0 - lit * 0.75;

            gl_FragColor = vec4(color, clamp(intensity * depth * night, 0.0, 1.0));
            #include <colorspace_fragment>
          }
        `,
      }),
    []
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const world = worldStore.world()

    shown.current = damp(shown.current, world.auroras ? 1 : 0, MEDIUM * 0.5, dt)
    material.uniforms.uTime.value += dt
    material.uniforms.uSeed.value = world.seed
    material.uniforms.uStrength.value = shown.current

    if (mesh.current) {
      mesh.current.visible = shown.current > 0.01
      // Hung above the weather, where the real ones are.
      mesh.current.scale.setScalar(cloudRadius(world.roughness) + 0.055)
    }
  })

  return (
    <mesh ref={mesh} geometry={geometry} material={material} visible={false} />
  )
}
