import { IcosahedronGeometry, SphereGeometry } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * The meshes the shells are cut from, and the one place their density is
 * decided.
 *
 * Every shape here is a sphere the shaders paint from a noise field, so the
 * triangles buy exactly one thing: a silhouette. Past the point where a
 * triangle is narrower than a pixel they buy nothing at all, and they are
 * expensive, because the terrain runs eleven octaves of noise at every vertex
 * and the rasteriser shades a whole quad for each sliver it meets.
 */

/**
 * Her ground.
 *
 * An icosahedron arrives with every triangle carrying its own three vertices,
 * so a shared corner is shaded six times over. Welding them costs a moment at
 * startup and returns the same surface for a sixth of the work. The uv seam is
 * dropped first, since the shader reads a direction and never a coordinate, and
 * a seam is precisely a place where welding is refused.
 */
export function createPlanetGeometry(detail = 48) {
  const geometry = new IcosahedronGeometry(1, detail)
  geometry.deleteAttribute('normal')
  geometry.deleteAttribute('uv')
  return mergeVertices(geometry)
}

/**
 * Everything hung above the ground: weather, air, aurora, blast.
 *
 * These are perfect spheres whose detail lives entirely in the fragment stage,
 * so they need only enough segments for the limb to read as a curve. At this
 * size ninety-six of them leave the silhouette under a pixel from true.
 */
export function createShellGeometry(radius = 1) {
  return new SphereGeometry(radius, 96, 48)
}
