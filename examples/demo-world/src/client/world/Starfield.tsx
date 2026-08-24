import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry, PointsMaterial } from 'three'

/** The empty around her. Static, because nothing out there is hers yet. */
export default function Starfield() {
  const { geometry, material } = useMemo(() => {
    const count = 1400
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 40 + Math.random() * 30
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
      positions[i * 3 + 1] = Math.cos(phi) * radius
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    return {
      geometry,
      material: new PointsMaterial({
        size: 0.28,
        color: '#cdd6ff',
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.75,
      }),
    }
  }, [])

  return <points geometry={geometry} material={material} />
}
