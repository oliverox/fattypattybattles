import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, Color, Group } from 'three'
import { HeldCard } from './HeldCard'

export interface AvatarConfig {
  skinColor: string
  hairStyle: string
  hairColor: string
  eyeColor?: string
  mouthStyle?: string
}

interface PlayerMeshProps {
  facingAngle: React.RefObject<number>
  avatarConfig?: AvatarConfig
}

const DEFAULT_AVATAR: AvatarConfig = {
  skinColor: '#FFE0BD',
  hairStyle: 'short',
  hairColor: '#000000',
  eyeColor: '#4A4A4A',
  mouthStyle: 'smile',
}

function EyeMesh({ color }: { color: string }) {
  const eyeColor = new Color(color)

  return (
    <group position={[0, 0.65, -0.35]}>
      {/* Left eye */}
      <mesh position={[-0.15, 0, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.15, 0, -0.04]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color={color} emissive={eyeColor} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-0.15, 0, -0.06]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Right eye */}
      <mesh position={[0.15, 0, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.15, 0, -0.04]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color={color} emissive={eyeColor} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.15, 0, -0.06]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  )
}

function MouthMesh({ style }: { style: string }) {
  switch (style) {
    case 'smile':
      return (
        <group position={[0, 0.35, -0.42]}>
          {/* Curved smile using small spheres */}
          {[-0.1, -0.05, 0, 0.05, 0.1].map((x, i) => (
            <mesh key={i} position={[x, -Math.abs(x) * 0.5, 0]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#CC5555" />
            </mesh>
          ))}
        </group>
      )
    case 'open':
      return (
        <mesh position={[0, 0.35, -0.42]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color="#330000" />
        </mesh>
      )
    case 'surprised':
      return (
        <mesh position={[0, 0.35, -0.42]}>
          <torusGeometry args={[0.06, 0.02, 8, 16]} />
          <meshBasicMaterial color="#CC5555" />
        </mesh>
      )
    case 'flat':
      return (
        <mesh position={[0, 0.35, -0.42]}>
          <boxGeometry args={[0.15, 0.02, 0.02]} />
          <meshBasicMaterial color="#CC5555" />
        </mesh>
      )
    case 'grin':
      return (
        <group position={[0, 0.35, -0.42]}>
          {/* Wide grin */}
          {[-0.12, -0.06, 0, 0.06, 0.12].map((x, i) => (
            <mesh key={i} position={[x, -Math.abs(x) * 0.3, 0]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color="#CC5555" />
            </mesh>
          ))}
        </group>
      )
    default:
      return null
  }
}

function HairMesh({ style, color }: { style: string; color: string }) {
  const hairColor = new Color(color)

  switch (style) {
    case 'spiky':
      // Multiple cones pointing up
      return (
        <group position={[0, 1, 0]}>
          <mesh position={[0, 0.15, 0]} rotation={[0, 0, 0]}>
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
      // Elongated capsule hanging down back
      return (
        <group position={[0, 0.7, 0.3]}>
          <mesh rotation={[0.5, 0, 0]}>
            <capsuleGeometry args={[0.25, 0.8, 4, 12]} />
            <meshStandardMaterial color={color} emissive={hairColor} emissiveIntensity={0.2} />
          </mesh>
        </group>
      )
    case 'curly':
      // Multiple small spheres clustered on top
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
      // Small hemisphere on top
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

export function PlayerMesh({ facingAngle, avatarConfig }: PlayerMeshProps) {
  const meshRef = useRef<Mesh>(null)
  const groupRef = useRef<Group>(null)

  const config = avatarConfig ?? DEFAULT_AVATAR
  const skinColor = new Color(config.skinColor)

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
      {/* Body - uses skin color */}
      <mesh ref={meshRef} castShadow receiveShadow>
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
      {/* Eyes */}
      <EyeMesh color={config.eyeColor ?? '#4A4A4A'} />
      {/* Mouth */}
      <MouthMesh style={config.mouthStyle ?? 'smile'} />
      <HeldCard />
    </group>
  )
}
