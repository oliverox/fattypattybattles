import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Color } from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { COLORS } from '@/lib/game/constants'

interface RetroBuildingProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export function RetroBuilding({ position = [0, 0, 0], rotation = [0, 0, 0] }: RetroBuildingProps) {
  const windowsRef = useRef<Group>(null)

  // Animated window lights
  useFrame(({ clock }) => {
    if (windowsRef.current) {
      windowsRef.current.children.forEach((child, i) => {
        const flicker = Math.sin(clock.elapsedTime * 3 + i) > 0.7
        const material = (child as any).material
        if (material && material.emissiveIntensity !== undefined) {
          material.emissiveIntensity = flicker ? 2 : 0.5
        }
      })
    }
  })

  return (
    <RigidBody type="fixed" position={position} rotation={rotation}>
      <CuboidCollider args={[8, 15, 5]} position={[0, 15, 0]} />
      <group>
        {/* Main building body */}
        <mesh position={[0, 15, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 30, 10]} />
          <meshStandardMaterial color={COLORS.darkPurple} />
        </mesh>

        {/* Neon outline strips - vertical */}
        {[-8, 8].map((x, i) => (
          <mesh key={`v${i}`} position={[x, 15, 5.1]}>
            <boxGeometry args={[0.2, 30, 0.1]} />
            <meshBasicMaterial color={COLORS.neonCyan} />
          </mesh>
        ))}

        {/* Horizontal neon strips */}
        {[5, 15, 25].map((y, i) => (
          <mesh key={`h${i}`} position={[0, y, 5.1]}>
            <boxGeometry args={[16, 0.2, 0.1]} />
            <meshBasicMaterial color={COLORS.neonPink} />
          </mesh>
        ))}

        {/* Windows */}
        <group ref={windowsRef}>
          {Array.from({ length: 5 }).map((_, row) =>
            Array.from({ length: 3 }).map((_, col) => (
              <mesh key={`${row}-${col}`} position={[-5 + col * 5, 8 + row * 5, 5.1]}>
                <planeGeometry args={[2, 3]} />
                <meshStandardMaterial
                  color={COLORS.neonCyan}
                  emissive={new Color(COLORS.neonCyan)}
                  emissiveIntensity={0.5}
                />
              </mesh>
            ))
          )}
        </group>

        {/* Rooftop antenna */}
        <mesh position={[0, 32, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 4]} />
          <meshBasicMaterial color={COLORS.neonPink} />
        </mesh>
      </group>
    </RigidBody>
  )
}
