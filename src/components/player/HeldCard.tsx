import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Group, Color } from 'three'
import { COLORS } from '@/lib/game/constants'
import { useGameStore } from '@/stores/gameStore'

// Simple held card display - shows a glowing card indicator when a card is held
export function HeldCard() {
  const groupRef = useRef<Group>(null)
  const heldCardId = useGameStore((state) => state.heldCardId)

  useFrame(({ clock }) => {
    if (!groupRef.current) return

    // Gentle floating and rotation animation
    groupRef.current.position.y = 1.8 + Math.sin(clock.elapsedTime * 2) * 0.1
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.2
  })

  // Don't render if no card is held
  if (!heldCardId) {
    return null
  }

  return (
    <group ref={groupRef} position={[1, 1.8, 0]}>
      {/* Card background */}
      <mesh>
        <planeGeometry args={[0.6, 0.8]} />
        <meshStandardMaterial
          color={COLORS.darkPurple}
          emissive={new Color(COLORS.neonPink)}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Card border glow */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[0.68, 0.88]} />
        <meshBasicMaterial
          color={COLORS.neonPink}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Card indicator */}
      <Text
        position={[0, 0, 0.02]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ♠
        <meshBasicMaterial color="white" />
      </Text>
    </group>
  )
}
