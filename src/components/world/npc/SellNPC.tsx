import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { Group, Color, MathUtils } from 'three'
import { COLORS } from '@/lib/game/constants'
import { useGameStore } from '@/stores/gameStore'

interface SellNPCProps {
  position?: [number, number, number]
}

export function SellNPC({ position = [0, 0, 0] }: SellNPCProps) {
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

    // Animate eye glow with golden color
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
          {/* Body - Octahedron (merchant/jewel shape) */}
          <mesh position={[0, 1.2, 0]}>
            <octahedronGeometry args={[0.8]} />
            <meshStandardMaterial
              color={COLORS.neonOrange}
              emissive={new Color(COLORS.neonOrange)}
              emissiveIntensity={0.5}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Inner glow sphere */}
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.45]} />
            <meshBasicMaterial
              color={COLORS.sunYellow}
              transparent
              opacity={0.4}
            />
          </mesh>

          {/* Face container */}
          <group position={[0, 1.2, 0.55]}>
            {/* Left eye - coin shaped */}
            <mesh ref={eyeLeftRef} position={[-0.2, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
              <meshStandardMaterial
                color={COLORS.sunYellow}
                emissive={new Color(COLORS.sunYellow)}
                emissiveIntensity={1.5}
              />
            </mesh>

            {/* Right eye - coin shaped */}
            <mesh ref={eyeRightRef} position={[0.2, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
              <meshStandardMaterial
                color={COLORS.sunYellow}
                emissive={new Color(COLORS.sunYellow)}
                emissiveIntensity={1.5}
              />
            </mesh>

            {/* Money mouth - $ shape made of spheres */}
            {([
              [0, -0.1],
              [0.08, -0.15],
              [0, -0.2],
              [-0.08, -0.25],
              [0, -0.3],
            ] as const).map(([x, y], i) => (
              <mesh key={i} position={[x, y, 0.05]}>
                <sphereGeometry args={[0.03]} />
                <meshBasicMaterial color={COLORS.sunYellow} />
              </mesh>
            ))}
          </group>

          {/* Hovering ring around body - gold */}
          <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.0, 0.06, 8, 32]} />
            <meshBasicMaterial color={COLORS.sunYellow} />
          </mesh>

          {/* Base/pedestal */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.5, 0.6, 0.3, 8]} />
            <meshStandardMaterial
              color={COLORS.darkPurple}
              emissive={new Color(COLORS.neonOrange)}
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Base ring - gold */}
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.65, 0.05, 8, 32]} />
            <meshBasicMaterial color={COLORS.sunYellow} />
          </mesh>
        </group>
      </Float>
    </group>
  )
}
