import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, Color } from 'three'
import { COLORS } from '@/lib/game/constants'

export function PlayerMesh() {
  const meshRef = useRef<Mesh>(null)

  // Pulsing glow effect
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = Math.sin(clock.elapsedTime * 2) * 0.3 + 0.7
      const material = meshRef.current.material as any
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = pulse
      }
    }
  })

  return (
    <mesh ref={meshRef} castShadow>
      <capsuleGeometry args={[0.5, 1, 4, 16]} />
      <meshStandardMaterial
        color={COLORS.neonCyan}
        emissive={new Color(COLORS.neonCyan)}
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  )
}
