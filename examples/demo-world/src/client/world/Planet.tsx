import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, Group, Mesh, Vector3 } from 'three'
import { clamp, health } from '../../shared/world'
import { worldStore } from '../store/WorldStore'
import { paletteOf } from './palette'
import {
  createAtmosphereMaterial,
  createCloudMaterial,
  createPlanetMaterial,
  setForest,
} from './shaders/planet'
import { FAST, MEDIUM, SLOW, damp } from './damp'
import { atmosphereRadius, cloudRadius } from './scale'
import { SUN_DIRECTION } from './star'
import Auroras from './Auroras'
import EventFx from './EventFx'
import Shockwave from './Shockwave'
import { currentEvent, currentSurge, eventFlash } from './eventTiming'
import { createPlanetGeometry, createShellGeometry } from './geometry'

/**
 * Her body, and the main status indicator of the whole experience: colour,
 * light and above all the rhythm of her breathing say how she is doing before
 * any gauge does, and before she says it herself.
 */
export default function Planet() {
  const group = useRef<Group>(null)
  const surface = useRef<Mesh>(null)
  const clouds = useRef<Mesh>(null)
  const airShell = useRef<Mesh>(null)

  const planetMaterial = useMemo(createPlanetMaterial, [])
  const atmosphereMaterial = useMemo(createAtmosphereMaterial, [])
  const cloudMaterial = useMemo(createCloudMaterial, [])

  const surfaceGeometry = useMemo(() => createPlanetGeometry(), [])
  const shellGeometry = useMemo(() => createShellGeometry(), [])

  // Displayed values trail the simulated ones.
  const shown = useRef({
    water: 0,
    heat: 0.95,
    breath: 0.06,
    vegetation: 0,
    life: 0,
    clouds: 0.05,
    cities: 0,
    roughness: 0.55,
    growth: 0,
    breathPhase: 0,
  })
  const colors = useRef({
    deep: new Color(),
    shallow: new Color(),
    low: new Color(),
    high: new Color(),
    peak: new Color(),
    sky: new Color(),
  })
  const sunDir = useMemo(() => new Vector3(...SUN_DIRECTION).normalize(), [])
  // The star and the eye, expressed in her frame, which is where the noise
  // lives. She turns, they do not, so they are rotated back once per frame
  // instead of being converted per fragment.
  const sunLocal = useMemo(() => new Vector3(), [])
  const eyeLocal = useMemo(() => new Vector3(), [])
  const axisY = useMemo(() => new Vector3(0, 1, 0), [])

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.1)
    const world = worldStore.world()
    const state = shown.current
    const palette = paletteOf(world.palette)

    // The gap between what she is and what is being drawn is exactly how fast
    // the green is spreading, so the growth front costs nothing to know.
    const gaining = clamp((world.vegetation - state.vegetation) * 5)
    state.growth = damp(state.growth, gaining, FAST, dt)

    // Whether her surface is compiled with a forest in it at all. Asked of the
    // simulated value and the displayed one at once, so the code is in place
    // before the first green appears and stays until the last of it has faded,
    // and with a little hysteresis so a world hovering at nothing does not
    // rebuild the shader every second.
    setForest(
      planetMaterial,
      Math.max(world.vegetation, state.vegetation) >
        (planetMaterial.defines?.HAS_FOREST ? 0.001 : 0.002)
    )

    state.water = damp(state.water, world.water, SLOW, dt)
    state.heat = damp(state.heat, world.heat, MEDIUM, dt)
    state.breath = damp(state.breath, world.breath, MEDIUM, dt)
    state.vegetation = damp(state.vegetation, world.vegetation, SLOW, dt)
    state.life = damp(state.life, world.life, SLOW, dt)
    state.clouds = damp(state.clouds, world.clouds, MEDIUM, dt)
    state.cities = damp(state.cities, world.cities, SLOW, dt)
    state.roughness = damp(state.roughness, world.roughness, SLOW, dt)

    for (const key of [
      'deep',
      'shallow',
      'low',
      'high',
      'peak',
      'sky',
    ] as const) {
      colors.current[key].lerp(palette[key], 1 - Math.exp(-MEDIUM * dt))
    }

    // Breathing: slow and deep when she is well, short and quick when she is not.
    const wellbeing = health(world)
    state.breathPhase += dt * (0.45 + (1 - wellbeing) * 2.2)
    const swell =
      Math.sin(state.breathPhase) * (0.004 + 0.008 * (1 - wellbeing))

    const event = currentEvent()
    const flash = event?.id === 'freeze' ? 0 : eventFlash(event) * 0.9

    // A gesture winding up inflates her a little, and letting it go snaps the
    // inflation back, which is the difference between an animation and a body.
    const surge = currentSurge()
    let strain = 0
    if (surge?.kind === 'charging')
      strain = surge.progress * surge.progress * 0.02
    else if (surge?.kind === 'overshoot') {
      strain = 0.03 * Math.exp(-surge.progress / 0.15)
    }

    const spin = group.current ? -group.current.rotation.y : 0
    sunLocal.copy(sunDir).applyAxisAngle(axisY, spin)
    eyeLocal.copy(frame.camera.position).applyAxisAngle(axisY, spin)

    const planet = planetMaterial.uniforms
    planet.uTime.value += dt
    planet.uSeed.value = world.seed
    planet.uWater.value = state.water
    planet.uHeat.value = state.heat
    planet.uRoughness.value = state.roughness
    planet.uVegetation.value = state.vegetation
    planet.uLife.value = state.life
    planet.uCities.value = state.cities
    planet.uGrowth.value = state.growth
    planet.uFlash.value = flash + strain * 6
    planet.uSunLocal.value.copy(sunLocal)
    planet.uEyeLocal.value.copy(eyeLocal)
    planet.uDeep.value.copy(colors.current.deep)
    planet.uShallow.value.copy(colors.current.shallow)
    planet.uLow.value.copy(colors.current.low)
    planet.uHigh.value.copy(colors.current.high)
    planet.uPeak.value.copy(colors.current.peak)

    const air = atmosphereMaterial.uniforms
    air.uDensity.value = 0.3 + state.breath * 1.05
    air.uColor.value.copy(colors.current.sky)
    air.uSunDir.value.copy(sunDir)

    const weather = cloudMaterial.uniforms
    weather.uTime.value += dt
    weather.uSeed.value = world.seed
    weather.uCover.value = state.clouds
    weather.uBreath.value = state.breath
    // Integrated, so changing the wind speed changes the speed and nothing
    // else. See the note in the cloud shader.
    weather.uWindPhase.value += dt * (0.04 + state.breath * 0.5)
    weather.uSunDir.value.copy(sunDir)

    if (group.current) group.current.rotation.y += dt * 0.035
    if (surface.current) surface.current.scale.setScalar(1 + swell + strain)

    // The sky follows the relief: taller mountains push the weather out, so a
    // summit can never come through a cloud.
    if (clouds.current) {
      // Thick air moves fast: the weather turning is the only way a number
      // called "souffle" becomes something anyone can see.
      clouds.current.rotation.y += dt * (0.006 + state.breath * 0.075)
      clouds.current.scale.setScalar(cloudRadius(state.roughness))
    }
    if (airShell.current) {
      airShell.current.scale.setScalar(
        atmosphereRadius(state.roughness, state.breath)
      )
    }
  })

  return (
    <group ref={group}>
      <mesh
        ref={surface}
        geometry={surfaceGeometry}
        material={planetMaterial}
      />
      <mesh ref={clouds} geometry={shellGeometry} material={cloudMaterial} />
      <Auroras />
      <EventFx />
      <Shockwave />
      <mesh
        ref={airShell}
        geometry={shellGeometry}
        material={atmosphereMaterial}
      />
    </group>
  )
}
