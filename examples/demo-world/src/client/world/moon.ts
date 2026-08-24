import { BufferGeometry, IcosahedronGeometry, Vector3 } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { randomDirection, seededRandom } from './asteroid'

/**
 * A moon is not an asteroid, and the difference is the silhouette.
 *
 * The rock that falls on her is a chip off something bigger, so its outline has
 * straight cuts and no two axes agree. A moon is what gravity pulled back into
 * a ball: seen against the black it is a circle, and everything that ever
 * happened to it happened to its face. So the flat cuts go, the craters
 * multiply, and a few of them are allowed to be enormous, because a basin
 * spanning a third of the disc is the one thing that tells the eye it is
 * looking at a world rather than at a pebble held close.
 *
 * Three of them exist and they are meant to be told apart at a glance: stone,
 * ice, and rust. Same generator, three sets of numbers.
 */

interface MoonRecipe {
  /** What it is made of, which is most of what distinguishes it. */
  color: string
  /** How far from round it is allowed to drift. */
  lumpiness: number
  /** How many impacts it has kept. Ice resurfaces itself, stone does not. */
  craters: number
  /** How deep an impact digs, relative to its width. */
  bite: number
}

const RECIPES: MoonRecipe[] = [
  // Stone. The default moon, and the most heavily marked.
  { color: '#9c948a', lumpiness: 0.05, craters: 34, bite: 0.24 },
  // Ice. Brighter, smoother, and its few craters are shallow.
  { color: '#ccd6e0', lumpiness: 0.028, craters: 15, bite: 0.15 },
  // Rust. Darker and more battered, with the deepest basins of the three.
  { color: '#8c6853', lumpiness: 0.075, craters: 26, bite: 0.3 },
]

export interface MoonShape {
  geometry: BufferGeometry
  color: string
  /** Round, but never perfectly: a small body keeps a little of its history. */
  stretch: [number, number, number]
  /** Slow, and around an axis of its own. */
  spin: Vector3
}

/**
 * Detail eight, which is thirteen hundred triangles and more than enough.
 *
 * The craters are cut into the mesh rather than painted on, so they need
 * vertices to be cut into, and below this the big basins turn into pentagons.
 * These bodies are a fraction of the screen, so it costs nothing worth counting.
 *
 * The welding is what makes them round. An icosahedron arrives with every
 * triangle carrying its own three corners, and normals computed on that are
 * face normals however the material is set: the moon comes out a lump of flat
 * plates. Sharing the corners first, and only then measuring the normals, is
 * the difference between a rock and a world.
 */
export function createMoon(index: number, detail = 8): MoonShape {
  const recipe = RECIPES[index % RECIPES.length]
  const random = seededRandom(index * 977 + 13)

  const raw = new IcosahedronGeometry(1, detail)
  raw.deleteAttribute('normal')
  raw.deleteAttribute('uv')
  const geometry = mergeVertices(raw)

  // Broad swellings only, and gentle ones. No cuts: a cut is what makes a rock
  // read as a fragment, and a fragment is exactly what this is not.
  const lobes = Array.from({ length: 3 + Math.floor(random() * 3) }, () => ({
    direction: randomDirection(random),
    amplitude: recipe.lumpiness * (0.6 + random() * 0.9),
  }))

  // Sizes cubed, so most impacts are small and one or two are the kind you
  // name. An even spread of middling craters reads as a golf ball.
  const craters = Array.from({ length: recipe.craters }, () => {
    const radius = 0.07 + Math.pow(random(), 3) * 0.62
    return {
      direction: randomDirection(random),
      radius,
      depth: radius * recipe.bite * (0.7 + random() * 0.6),
    }
  })

  const position = geometry.attributes.position
  const direction = new Vector3()

  for (let i = 0; i < position.count; i++) {
    direction.fromBufferAttribute(position, i).normalize()
    let radius = 1

    for (const lobe of lobes) {
      const facing = Math.max(0, direction.dot(lobe.direction))
      radius += lobe.amplitude * facing * Math.sqrt(facing)
    }

    for (const crater of craters) {
      const distance = direction.angleTo(crater.direction)
      if (distance >= crater.radius) continue
      const t = 1 - distance / crater.radius

      // A bowl that flattens towards the middle rather than a cone, because a
      // crater floor is flat and only its walls are steep.
      radius -= crater.depth * t * t * (3 - 2 * t)

      // And the wall it threw up, just inside the rim. Without it the surface
      // reads as dented rather than as struck.
      radius += crater.depth * 0.42 * Math.max(0, 1 - Math.abs(t - 0.14) / 0.14)
    }

    position.setXYZ(
      i,
      direction.x * radius,
      direction.y * radius,
      direction.z * radius
    )
  }

  geometry.computeVertexNormals()
  geometry.attributes.position.needsUpdate = true

  return {
    geometry,
    color: recipe.color,
    stretch: [1, 0.93 + random() * 0.07, 0.9 + random() * 0.09],
    spin: randomDirection(random).multiplyScalar(0.03 + random() * 0.07),
  }
}
