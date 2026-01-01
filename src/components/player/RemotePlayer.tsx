import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import { Group, Color, Vector3, MathUtils } from 'three'
import { MULTIPLAYER, COLORS } from '@/lib/game/constants'

interface AvatarConfig {
  skinColor: string
  hairStyle: string
  hairColor: string
}

interface RemotePlayerProps {
  username: string
  position: { x: number; y: number; z: number }
  rotation: number
  avatarConfig?: AvatarConfig
}

const DEFAULT_AVATAR: AvatarConfig = {
  skinColor: '#FFE0BD',
  hairStyle: 'short',
  hairColor: '#000000',
}

function HairMesh({ style, color }: { style: string; color: string }) {
  const hairColor = new Color(color)

  switch (style) {
    case 'spiky':
      return (
        <group position={[0, 1, 0]}>
          <mesh position={[0, 0.15, 0]}>
            <coneGeometry args={[0.12, 0.4, 6]} />
            <meshStandardMaterial color={color} emissive={hairColor} emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0.2, 0.1, 0]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.1, 0.35, 6]} />
            <meshStandardMaterial color={color} emissive={hairColor} emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[-0.2, 0.1, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.1, 0.35, 6]} />
            <meshStandardMaterial color={color} emissive={hairColor} emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0, 0.1, 0.15]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.1, 0.3, 6]} />
            <meshStandardMaterial color={color} emissive={hairColor} emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0, 0.1, -0.15]} rotation={[-0.3, 0, 0]}>
            <coneGeometry args={[0.1, 0.3, 6]} />
            <meshStandardMaterial color={color} emissive={hairColor} emissiveIntensity={0.2} />
          </mesh>
        </group>
      )
    case 'long':
      return (
        <group position={[0, 0.7, 0.3]}>
          <mesh rotation={[0.5, 0, 0]}>
            <capsuleGeometry args={[0.25, 0.8, 4, 12]} />
            <meshStandardMaterial color={color} emissive={hairColor} emissiveIntensity={0.2} />
          </mesh>
        </group>
      )
    case 'curly':
      return (
        <group position={[0, 1, 0]}>
          {[
            [0, 0.1, 0],
            [0.15, 0.05, 0.1],
            [-0.15, 0.05, 0.1],
            [0.15, 0.05, -0.1],
            [-0.15, 0.05, -0.1],
            [0, 0.05, 0.2],
            [0, 0.05, -0.2],
            [0.25, 0, 0],
            [-0.25, 0, 0],
          ].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshStandardMaterial color={color} emissive={hairColor} emissiveIntensity={0.2} />
            </mesh>
          ))}
        </group>
      )
    case 'short':
      return (
        <mesh position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} emissive={hairColor} emissiveIntensity={0.2} />
        </mesh>
      )
    case 'bald':
    default:
      return null
  }
}

export function RemotePlayer({
  username,
  position,
  rotation,
  avatarConfig,
}: RemotePlayerProps) {
  const groupRef = useRef<Group>(null)
  const currentPosition = useRef(new Vector3(position.x, position.y, position.z))
  const currentRotation = useRef(rotation)

  const config = avatarConfig ?? DEFAULT_AVATAR
  const skinColor = new Color(config.skinColor)

  // Smooth interpolation for position and rotation
  useFrame(() => {
    if (!groupRef.current) return

    // Lerp position
    currentPosition.current.x = MathUtils.lerp(
      currentPosition.current.x,
      position.x,
      MULTIPLAYER.interpolationSpeed
    )
    currentPosition.current.y = MathUtils.lerp(
      currentPosition.current.y,
      position.y,
      MULTIPLAYER.interpolationSpeed
    )
    currentPosition.current.z = MathUtils.lerp(
      currentPosition.current.z,
      position.z,
      MULTIPLAYER.interpolationSpeed
    )

    // Lerp rotation
    currentRotation.current = MathUtils.lerp(
      currentRotation.current,
      rotation,
      MULTIPLAYER.interpolationSpeed
    )

    // Apply interpolated values
    groupRef.current.position.copy(currentPosition.current)
    groupRef.current.rotation.y = -currentRotation.current
  })

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {/* Username tag - billboards to always face camera */}
      <Billboard position={[0, 2.5, 0]}>
        <Text
          fontSize={0.3}
          color={COLORS.neonCyan}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {username}
        </Text>
      </Billboard>

      {/* Player body */}
      <group>
        {/* Body - uses skin color */}
        <mesh castShadow>
          <capsuleGeometry args={[0.5, 1, 4, 16]} />
          <meshStandardMaterial
            color={config.skinColor}
            emissive={skinColor}
            emissiveIntensity={0.5}
            metalness={0.3}
            roughness={0.5}
          />
        </mesh>
        {/* Hair */}
        <HairMesh style={config.hairStyle} color={config.hairColor} />
      </group>
    </group>
  )
}
