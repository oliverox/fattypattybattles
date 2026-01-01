import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Color } from 'three'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import { COLORS } from '@/lib/game/constants'

interface NeonPalmTreeProps {
  position?: [number, number, number]
}

export function NeonPalmTree({ position = [0, 0, 0] }: NeonPalmTreeProps) {
  const leavesRef = useRef<Group>(null)

  // Gentle sway animation
  useFrame(({ clock }) => {
    if (leavesRef.current) {
      leavesRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.05
    }
  })

  return (
    <RigidBody type="fixed" position={position}>
      <CylinderCollider args={[4, 0.3]} position={[0, 4, 0]} />
      <group>
        {/* Trunk */}
        <mesh position={[0, 4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.5, 8, 8]} />
          <meshStandardMaterial color="#2d1b4e" />
        </mesh>

        {/* Neon ring accents on trunk */}
        {[2, 4, 6].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.4, 0.05, 8, 16]} />
            <meshBasicMaterial color={COLORS.neonPink} />
          </mesh>
        ))}

        {/* Leaves group */}
        <group ref={leavesRef} position={[0, 8, 0]}>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * 2, 0, Math.sin(angle) * 2]}
                rotation={[0.8, angle, 0]}
              >
                <coneGeometry args={[0.5, 4, 4]} />
                <meshStandardMaterial
                  color={COLORS.neonCyan}
                  emissive={new Color(COLORS.neonCyan)}
                  emissiveIntensity={0.3}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            )
          })}
        </group>
      </group>
    </RigidBody>
  )
}
