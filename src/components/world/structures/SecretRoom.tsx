import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { Group, Color } from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { SECRET_ROOM, COLORS } from '@/lib/game/constants'

interface SecretRoomProps {
  onExit?: () => void
}

export function SecretRoom({ onExit }: SecretRoomProps) {
  const trophyRef = useRef<Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const textRef = useRef<Group>(null)

  const roomColor = '#1a0a2e' // Dark purple
  const accentColor = '#8b00ff' // Neon purple
  const goldColor = '#ffd700' // Gold for trophy

  useFrame(({ clock }) => {
    // Rotate the trophy slowly
    if (trophyRef.current) {
      trophyRef.current.rotation.y = clock.elapsedTime * 0.5
    }
    // Pulse the glow
    if (glowRef.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.1
      glowRef.current.scale.set(scale, scale, scale)
    }
    // Pulse the text
    if (textRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.05
      textRef.current.scale.set(pulse, pulse, 1)
    }
  })

  const position = SECRET_ROOM.interiorPosition

  return (
    <group position={position}>
      {/* Floor */}
      <RigidBody type="fixed">
        <CuboidCollider args={[15, 0.5, 15]} position={[0, -0.5, 0]} />
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[30, 1, 30]} />
          <meshStandardMaterial color={roomColor} side={THREE.DoubleSide} />
        </mesh>
      </RigidBody>

      {/* Ceiling */}
      <mesh position={[0, 12, 0]}>
        <boxGeometry args={[30, 0.5, 30]} />
        <meshStandardMaterial color={roomColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Walls with neon trim */}
      {/* Back wall */}
      <RigidBody type="fixed">
        <CuboidCollider args={[15, 6, 0.25]} position={[0, 6, -15]} />
        <mesh position={[0, 6, -15]}>
          <boxGeometry args={[30, 12, 0.5]} />
          <meshStandardMaterial color={roomColor} side={THREE.DoubleSide} />
        </mesh>
      </RigidBody>

      {/* Front wall with exit */}
      <RigidBody type="fixed">
        <CuboidCollider args={[15, 6, 0.25]} position={[0, 6, 15]} />
        <mesh position={[0, 6, 15]}>
          <boxGeometry args={[30, 12, 0.5]} />
          <meshStandardMaterial color={roomColor} side={THREE.DoubleSide} />
        </mesh>
      </RigidBody>

      {/* Left wall */}
      <RigidBody type="fixed">
        <CuboidCollider args={[0.25, 6, 15]} position={[-15, 6, 0]} />
        <mesh position={[-15, 6, 0]}>
          <boxGeometry args={[0.5, 12, 30]} />
          <meshStandardMaterial color={roomColor} side={THREE.DoubleSide} />
        </mesh>
      </RigidBody>

      {/* Right wall */}
      <RigidBody type="fixed">
        <CuboidCollider args={[0.25, 6, 15]} position={[15, 6, 0]} />
        <mesh position={[15, 6, 0]}>
          <boxGeometry args={[0.5, 12, 30]} />
          <meshStandardMaterial color={roomColor} side={THREE.DoubleSide} />
        </mesh>
      </RigidBody>

      {/* Neon trim on floor edges */}
      {[
        [0, 0.01, -14.9, 30, 0.1, 0.1],
        [0, 0.01, 14.9, 30, 0.1, 0.1],
        [-14.9, 0.01, 0, 0.1, 0.1, 30],
        [14.9, 0.01, 0, 0.1, 0.1, 30],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`floor-trim-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>
      ))}

      {/* Central pedestal */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[1.5, 2, 2, 8]} />
        <meshStandardMaterial color="#333344" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Glowing ring around pedestal */}
      <mesh ref={glowRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.2, 32]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.6} />
      </mesh>

      {/* Trophy/reward visual */}
      <group ref={trophyRef} position={[0, 3, 0]}>
        {/* Star shape using multiple boxes */}
        <mesh>
          <boxGeometry args={[0.3, 1.5, 0.3]} />
          <meshStandardMaterial
            color={goldColor}
            emissive={new Color(goldColor)}
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.3, 1.5, 0.3]} />
          <meshStandardMaterial
            color={goldColor}
            emissive={new Color(goldColor)}
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.3, 1.5, 0.3]} />
          <meshStandardMaterial
            color={goldColor}
            emissive={new Color(goldColor)}
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.3, 1.5, 0.3]} />
          <meshStandardMaterial
            color={goldColor}
            emissive={new Color(goldColor)}
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.3, 1.5, 0.3]} />
          <meshStandardMaterial
            color={goldColor}
            emissive={new Color(goldColor)}
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Center sphere */}
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial
            color={goldColor}
            emissive={new Color(goldColor)}
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Floating text */}
      <group ref={textRef} position={[0, 8, 0]}>
        <Text
          fontSize={1.2}
          color={accentColor}
          anchorX="center"
          anchorY="middle"
        >
          SECRET FOUND
          <meshBasicMaterial color={accentColor} toneMapped={false} />
        </Text>
      </group>

      {/* Corner accent lights */}
      {[
        [-14, 10, -14],
        [14, 10, -14],
        [-14, 10, 14],
        [14, 10, 14],
      ].map(([x, y, z], i) => (
        <mesh key={`light-${i}`} position={[x, y, z]}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>
      ))}

      {/* Ambient point light */}
      <pointLight position={[0, 8, 0]} intensity={2} color={accentColor} distance={30} />
      <pointLight position={[0, 4, 0]} intensity={1} color={goldColor} distance={15} />
    </group>
  )
}
