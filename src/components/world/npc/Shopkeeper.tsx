import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { Group, Color, MathUtils } from 'three'
import { COLORS } from '@/lib/game/constants'
import { useGameStore } from '@/stores/gameStore'

interface ShopkeeperProps {
  position?: [number, number, number]
}

export function Shopkeeper({ position = [0, 0, 0] }: ShopkeeperProps) {
  const groupRef = useRef<Group>(null)
  const eyeLeftRef = useRef<any>(null)
  const eyeRightRef = useRef<any>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return

    const playerPosition = useGameStore.getState().playerPosition
    const npcX = position[0]
    const npcZ = position[2]

    const dx = playerPosition.x - npcX
    const dz = playerPosition.z - npcZ
    const targetAngle = Math.atan2(dx, dz)

    groupRef.current.rotation.y = MathUtils.lerp(
      groupRef.current.rotation.y,
      targetAngle,
      0.05
    )

    // Animate eye glow
    const eyeIntensity = 1.5 + Math.sin(clock.elapsedTime * 3) * 0.5
    if (eyeLeftRef.current?.material) {
      eyeLeftRef.current.material.emissiveIntensity = eyeIntensity
    }
    if (eyeRightRef.current?.material) {
      eyeRightRef.current.material.emissiveIntensity = eyeIntensity
    }
  })

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0} floatIntensity={0.3}>
        <group ref={groupRef}>
          {/* Body - Dodecahedron */}
          <mesh position={[0, 1.2, 0]}>
            <dodecahedronGeometry args={[0.8]} />
            <meshStandardMaterial
              color={COLORS.neonPurple}
              emissive={new Color(COLORS.neonPurple)}
              emissiveIntensity={0.5}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Inner glow sphere */}
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.5]} />
            <meshBasicMaterial
              color={COLORS.neonPink}
              transparent
              opacity={0.3}
            />
          </mesh>

          {/* Face container */}
          <group position={[0, 1.2, 0.6]}>
            {/* Left eye */}
            <mesh ref={eyeLeftRef} position={[-0.25, 0.15, 0]}>
              <sphereGeometry args={[0.12]} />
              <meshStandardMaterial
                color={COLORS.neonCyan}
                emissive={new Color(COLORS.neonCyan)}
                emissiveIntensity={1.5}
              />
            </mesh>

            {/* Right eye */}
            <mesh ref={eyeRightRef} position={[0.25, 0.15, 0]}>
              <sphereGeometry args={[0.12]} />
              <meshStandardMaterial
                color={COLORS.neonCyan}
                emissive={new Color(COLORS.neonCyan)}
                emissiveIntensity={1.5}
              />
            </mesh>

            {/* Smile - curved line made of small spheres */}
            {[-0.2, -0.1, 0, 0.1, 0.2].map((x, i) => (
              <mesh key={i} position={[x, -0.15 - Math.abs(x) * 0.3, 0.05]}>
                <sphereGeometry args={[0.04]} />
                <meshBasicMaterial color={COLORS.neonPink} />
              </mesh>
            ))}
          </group>

          {/* Hovering ring around body */}
          <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.1, 0.05, 8, 32]} />
            <meshBasicMaterial color={COLORS.neonCyan} />
          </mesh>

          {/* Base/pedestal */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.5, 0.6, 0.3, 8]} />
            <meshStandardMaterial
              color={COLORS.darkPurple}
              emissive={new Color(COLORS.neonPink)}
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Base ring */}
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.65, 0.05, 8, 32]} />
            <meshBasicMaterial color={COLORS.neonPink} />
          </mesh>
        </group>
      </Float>
    </group>
  )
}
