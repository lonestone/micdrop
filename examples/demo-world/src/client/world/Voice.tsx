import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BackSide, Color, Mesh, ShaderMaterial } from 'three'
import { voiceLevel } from '../store/voiceLevel'
import { worldStore } from '../store/WorldStore'
import { MEDIUM, damp } from './damp'
import { createShellGeometry } from './geometry'
import { atmosphereRadius } from './scale'

/**
 * The only status the interface still shows, and the only one worth showing.
 *
 * Listening and thinking are silences, and a silence with a widget in it is a
 * silence somebody is being hurried through. Speaking is different: two soft
 * shells sit just outside her air and are driven by what is coming out of the
 * speaker, so her voice has a body without a single pixel of chrome.
 *
 * Reading the sound itself rather than an animation of it is what makes the
 * difference between a planet that is speaking and a planet with a loading
 * indicator on it: the shells push out on the syllable that is heard and settle
 * in the pause after it, so a long word and a short one never look the same.
 *
 * They are drawn from the inside, like the atmosphere, so only the ring outside
 * her silhouette survives the depth test and nothing washes over her surface.
 */
const SHELLS = [
  { gap: 0.05, swell: 0.028, speed: 2.1, phase: 0, weight: 1 },
  { gap: 0.12, swell: 0.042, speed: 1.5, phase: Math.PI * 0.66, weight: 0.62 },
]

/**
 * Out on the syllable, back more slowly.
 *
 * A voice is heard in its attacks, so the rise has to land on the frame the
 * sound does. Letting the fall be just as quick turned every gap between two
 * syllables into a flicker, which reads as a fault rather than as speech.
 */
const ATTACK = 16
const RELEASE = 6

function createVoiceMaterial() {
  return new ShaderMaterial({
    transparent: true,
    side: BackSide,
    blending: AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uOpacity: { value: 0 },
      uColor: { value: new Color('#9db8ff') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vViewNormal;
      varying vec3 vViewDir;
      void main() {
        vViewNormal = normalize(normalMatrix * normalize(position));
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uColor;

      varying vec3 vViewNormal;
      varying vec3 vViewDir;

      void main() {
        if (uOpacity < 0.002) discard;
        // Wide rather than tight: a hard line on the limb would read as a
        // second planet made of glass, which is what an atmosphere looks like.
        float f = 1.0 - abs(dot(normalize(vViewNormal), normalize(vViewDir)));
        float shell = 0.10 + 0.9 * pow(f, 2.4);
        float alpha = shell * uOpacity;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
            #include <colorspace_fragment>
      }
    `,
  })
}

export default function Voice() {
  const meshes = useRef<(Mesh | null)[]>([])
  const shown = useRef(0)
  const time = useRef(0)
  const level = useRef(0)

  const geometry = useMemo(() => createShellGeometry(), [])
  const materials = useMemo(() => SHELLS.map(createVoiceMaterial), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const { status } = worldStore.getSnapshot()
    const world = worldStore.world()

    shown.current = damp(
      shown.current,
      status === 'speaking' ? 1 : 0,
      MEDIUM,
      dt
    )
    // The pulse only advances while she has something to say, so the two shells
    // are always caught mid-breath rather than snapping to a fixed pose.
    time.current += dt * shown.current

    // Folded into the fade, so the last syllable of a sentence carries the
    // shells back in with it instead of leaving them held out while they dim.
    const heard = voiceLevel(time.current) * shown.current
    level.current = damp(
      level.current,
      heard,
      heard > level.current ? ATTACK : RELEASE,
      dt
    )
    const loud = level.current

    const base = atmosphereRadius(world.roughness, world.breath)

    SHELLS.forEach((shell, index) => {
      const mesh = meshes.current[index]
      if (!mesh) return
      mesh.visible = shown.current > 0.01
      const beat = Math.sin(time.current * shell.speed + shell.phase)
      // The voice pushes on the gap and on the swell at once: quiet holds the
      // shells against her air and barely moves them, loud drives them out and
      // lights them, and the slow beat underneath keeps a pause breathing.
      mesh.scale.setScalar(
        base +
          shell.gap * (0.55 + 0.9 * loud) +
          beat * shell.swell * (0.35 + 0.65 * loud)
      )
      materials[index].uniforms.uOpacity.value =
        shown.current *
        shell.weight *
        (0.1 + 0.5 * loud + 0.12 * (beat * 0.5 + 0.5))
    })
  })

  return (
    <>
      {SHELLS.map((_, index) => (
        <mesh
          key={index}
          ref={(element) => {
            meshes.current[index] = element
          }}
          geometry={geometry}
          material={materials[index]}
          visible={false}
        />
      ))}
    </>
  )
}
