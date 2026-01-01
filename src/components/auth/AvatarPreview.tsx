import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Color } from 'three'

interface AvatarPreviewProps {
  skinColor: string
  hairStyle: string
  hairColor: string
  eyeColor?: string
  mouthStyle?: string
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

function AvatarModel({ skinColor, hairStyle, hairColor, eyeColor, mouthStyle }: AvatarPreviewProps) {
  const skin = new Color(skinColor)

  return (
    <group>
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.5, 1, 4, 16]} />
        <meshStandardMaterial
          color={skinColor}
          emissive={skin}
          emissiveIntensity={0.3}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
      {/* Hair */}
      <HairMesh style={hairStyle} color={hairColor} />
      {/* Eyes */}
      <EyeMesh color={eyeColor ?? '#4A4A4A'} />
      {/* Mouth */}
      <MouthMesh style={mouthStyle ?? 'smile'} />
    </group>
  )
}

export function AvatarPreview({ skinColor, hairStyle, hairColor, eyeColor, mouthStyle }: AvatarPreviewProps) {
  return (
    <div className="w-32 h-32 rounded-lg overflow-hidden border-4 border-gray-300 bg-gradient-to-b from-purple-900 to-purple-950">
      <Canvas camera={{ position: [0, 0.5, 3.5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 2]} intensity={0.8} />
        <AvatarModel skinColor={skinColor} hairStyle={hairStyle} hairColor={hairColor} eyeColor={eyeColor} mouthStyle={mouthStyle} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={2}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  )
}
