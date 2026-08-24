import { BufferGeometry, IcosahedronGeometry, Vector3 } from 'three'

/**
 * A regular icosahedron with flat shading is a golf ball, not a rock.
 *
 * What makes a body read as an asteroid is that nothing about it is even. Three
 * things do the work, and the flat cuts matter most: a rock is a chip off
 * something bigger, so its silhouette has straight edges no amount of bumping
 * will produce. Lobes then break the remaining symmetry and craters give the
 * surface a history.
 *
 * All three are pure functions of the direction, so the duplicated vertices of
 * a non indexed geometry all move together and the mesh never tears.
 */

/** Small deterministic generator, so a given body is always the same rock. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomDirection(random: () => number): Vector3 {
  const z = random() * 2 - 1
  const angle = random() * Math.PI * 2
  const radius = Math.sqrt(Math.max(0, 1 - z * z))
  return new Vector3(Math.cos(angle) * radius, z, Math.sin(angle) * radius)
}

export interface AsteroidShape {
  geometry: BufferGeometry
  /** Nothing is spherical, so the mesh is squashed along its own axes. */
  stretch: [number, number, number]
  /** It tumbles around an axis of its own, never neatly around Y. */
  spin: Vector3
}

export function createAsteroid(seed: number, detail = 3): AsteroidShape {
  const random = seededRandom(seed)
  const geometry = new IcosahedronGeometry(1, detail)

  const lobes = Array.from({ length: 3 + Math.floor(random() * 3) }, () => ({
    direction: randomDirection(random),
    amplitude: 0.2 + random() * 0.42,
  }))

  // The planes it broke along. Without these it stays a dented ball.
  const cuts = Array.from({ length: 4 + Math.floor(random() * 3) }, () => ({
    direction: randomDirection(random),
    distance: 0.62 + random() * 0.3,
  }))

  const craters = Array.from({ length: 7 + Math.floor(random() * 7) }, () => ({
    direction: randomDirection(random),
    radius: 0.22 + random() * 0.45,
    depth: 0.09 + random() * 0.15,
  }))

  const position = geometry.attributes.position
  const direction = new Vector3()

  for (let i = 0; i < position.count; i++) {
    direction.fromBufferAttribute(position, i).normalize()
    let radius = 1

    // Broad swellings, which is what breaks the symmetry.
    for (const lobe of lobes) {
      const facing = Math.max(0, direction.dot(lobe.direction))
      radius += lobe.amplitude * facing * Math.sqrt(facing)
    }

    // Sliced back to flat faces, which is what breaks the silhouette.
    for (const cut of cuts) {
      const facing = direction.dot(cut.direction)
      if (facing > 0.05) radius = Math.min(radius, cut.distance / facing)
    }

    // Bowls with a raised rim, which is what reads as an impact.
    for (const crater of craters) {
      const distance = direction.angleTo(crater.direction)
      if (distance >= crater.radius) continue
      const t = 1 - distance / crater.radius
      radius -= crater.depth * t * t * (3 - 2 * t)
      radius += crater.depth * 0.35 * Math.max(0, 1 - Math.abs(t - 0.12) / 0.12)
    }

    position.setXYZ(
      i,
      direction.x * radius,
      direction.y * radius,
      direction.z * radius
    )
  }

  geometry.computeVertexNormals()

  return {
    geometry,
    stretch: [1, 0.54 + random() * 0.24, 0.66 + random() * 0.26],
    spin: randomDirection(random).multiplyScalar(0.1 + random() * 0.22),
  }
}
