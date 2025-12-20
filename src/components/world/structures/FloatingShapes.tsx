import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { Mesh, Color } from 'three'
import { COLORS } from '@/lib/game/constants'

const shapes = [
  { position: [-8, 12, -5] as [number, number, number], geometry: 'octahedron', color: COLORS.neonPink },
  { position: [8, 15, -8] as [number, number, number], geometry: 'icosahedron', color: COLORS.neonCyan },
  { position: [0, 20, -15] as [number, number, number], geometry: 'dodecahedron', color: COLORS.neonPurple },
  { position: [-12, 10, 5] as [number, number, number], geometry: 'tetrahedron', color: COLORS.neonOrange },
  { position: [12, 18, 5] as [number, number, number], geometry: 'octahedron', color: COLORS.neonCyan },
]

export function FloatingShapes() {
  return (
    <group>
      {shapes.map((shape, i) => (
        <Float
          key={i}
          speed={1 + i * 0.2}
          rotationIntensity={1}
          floatIntensity={2}
        >
          <FloatingShape {...shape} index={i} />
        </Float>
      ))}
    </group>
  )
}

interface FloatingShapeProps {
  position: [number, number, number]
  geometry: string
  color: string
  index: number
}

function FloatingShape({ position, geometry, color, index }: FloatingShapeProps) {
  const meshRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.005

      // Pulsing emission
      const pulse = Math.sin(clock.elapsedTime * 2 + index) * 0.3 + 0.7
      const material = meshRef.current.material as any
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = pulse
      }
    }
  })

  const renderGeometry = () => {
    switch (geometry) {
      case 'octahedron':
        return <octahedronGeometry args={[1.5]} />
      case 'icosahedron':
        return <icosahedronGeometry args={[1.5]} />
      case 'dodecahedron':
        return <dodecahedronGeometry args={[1.5]} />
      case 'tetrahedron':
        return <tetrahedronGeometry args={[2]} />
      default:
        return <octahedronGeometry args={[1.5]} />
    }
  }

  return (
    <mesh ref={meshRef} position={position}>
      {renderGeometry()}
      <meshStandardMaterial
        color={color}
        emissive={new Color(color)}
        emissiveIntensity={0.5}
        metalness={0.9}
        roughness={0.1}
        wireframe
      />
    </mesh>
  )
}
