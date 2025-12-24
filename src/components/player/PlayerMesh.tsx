import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, Color, Group } from 'three'
import { COLORS } from '@/lib/game/constants'
import { HeldCard } from './HeldCard'

interface PlayerMeshProps {
  facingAngle: React.RefObject<number>
}

export function PlayerMesh({ facingAngle }: PlayerMeshProps) {
  const meshRef = useRef<Mesh>(null)
  const groupRef = useRef<Group>(null)

  // Pulsing glow effect and rotation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = Math.sin(clock.elapsedTime * 2) * 0.3 + 0.7
      const material = meshRef.current.material as any
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = pulse
      }
    }

    // Rotate to face the direction of movement
    if (groupRef.current) {
      groupRef.current.rotation.y = -facingAngle.current
    }
  })

  return (
    <group ref={groupRef}>
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
      {/* Direction indicator - cone pointing forward */}
      <mesh position={[0, 0.5, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.4, 8]} />
        <meshStandardMaterial
          color={COLORS.neonPink}
          emissive={new Color(COLORS.neonPink)}
          emissiveIntensity={0.5}
        />
      </mesh>
      <HeldCard />
    </group>
  )
}
