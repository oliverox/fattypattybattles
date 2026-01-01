import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { Group, Color, MathUtils } from 'three'
import { COLORS } from '@/lib/game/constants'
import { useGameStore } from '@/stores/gameStore'

interface BattleNPCProps {
  position?: [number, number, number]
}

export function BattleNPC({ position = [0, 0, 0] }: BattleNPCProps) {
  const groupRef = useRef<Group>(null)
  const eyeRef = useRef<any>(null)
  const antennaRef = useRef<any>(null)

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

    // Animate eye glow - red pulsing
    const eyeIntensity = 2 + Math.sin(clock.elapsedTime * 4) * 1
    if (eyeRef.current?.material) {
      eyeRef.current.material.emissiveIntensity = eyeIntensity
    }

    // Animate antenna
    if (antennaRef.current) {
      antennaRef.current.rotation.z = Math.sin(clock.elapsedTime * 2) * 0.1
    }
  })

  const robotColor = '#444444'
  const accentColor = '#ff3333'
  const glowColor = '#ff0000'

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.2}>
        <group ref={groupRef}>
          {/* Head - Box shape */}
          <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[0.8, 0.6, 0.7]} />
            <meshStandardMaterial
              color={robotColor}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          {/* Visor/Eye - single red eye */}
          <mesh ref={eyeRef} position={[0, 2, 0.36]}>
            <boxGeometry args={[0.6, 0.15, 0.05]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={new Color(glowColor)}
              emissiveIntensity={2}
            />
          </mesh>

          {/* Antenna */}
          <group ref={antennaRef} position={[0, 2.4, 0]}>
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
              <meshStandardMaterial color={robotColor} metalness={0.9} />
            </mesh>
            <mesh position={[0, 0.35, 0]}>
              <sphereGeometry args={[0.08]} />
              <meshStandardMaterial
                color={accentColor}
                emissive={new Color(accentColor)}
                emissiveIntensity={1}
              />
            </mesh>
          </group>

          {/* Body - Torso */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[1, 1.2, 0.6]} />
            <meshStandardMaterial
              color={robotColor}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          {/* Chest plate accent */}
          <mesh position={[0, 1.3, 0.31]}>
            <boxGeometry args={[0.6, 0.4, 0.02]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={new Color(accentColor)}
              emissiveIntensity={0.5}
            />
          </mesh>

          {/* Left shoulder */}
          <mesh position={[-0.65, 1.5, 0]}>
            <boxGeometry args={[0.4, 0.3, 0.4]} />
            <meshStandardMaterial
              color={robotColor}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          {/* Right shoulder */}
          <mesh position={[0.65, 1.5, 0]}>
            <boxGeometry args={[0.4, 0.3, 0.4]} />
            <meshStandardMaterial
              color={robotColor}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          {/* Left arm */}
          <mesh position={[-0.65, 1, 0]}>
            <boxGeometry args={[0.25, 0.7, 0.25]} />
            <meshStandardMaterial
              color={robotColor}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          {/* Right arm */}
          <mesh position={[0.65, 1, 0]}>
            <boxGeometry args={[0.25, 0.7, 0.25]} />
            <meshStandardMaterial
              color={robotColor}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          {/* Left fist */}
          <mesh position={[-0.65, 0.5, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={new Color(accentColor)}
              emissiveIntensity={0.3}
              metalness={0.8}
            />
          </mesh>

          {/* Right fist */}
          <mesh position={[0.65, 0.5, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={new Color(accentColor)}
              emissiveIntensity={0.3}
              metalness={0.8}
            />
          </mesh>

          {/* Base/pedestal */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.7, 0.3, 8]} />
            <meshStandardMaterial
              color={COLORS.darkPurple}
              emissive={new Color(accentColor)}
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Base ring */}
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.75, 0.05, 8, 32]} />
            <meshBasicMaterial color={accentColor} />
          </mesh>

          {/* Hovering battle ring */}
          <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.04, 8, 32]} />
            <meshBasicMaterial color={accentColor} />
          </mesh>
        </group>
      </Float>
    </group>
  )
}
