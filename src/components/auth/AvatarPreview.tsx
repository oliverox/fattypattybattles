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
    <group position={[0, 0.55, -0.48]}>
      {/* Left eye - oval shaped */}
      <mesh position={[-0.12, 0, 0]} scale={[1, 1.4, 0.5]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.12, 0, -0.02]} scale={[1, 1.4, 0.5]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={color} emissive={eyeColor} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.12, 0, -0.03]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Right eye - oval shaped */}
      <mesh position={[0.12, 0, 0]} scale={[1, 1.4, 0.5]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.12, 0, -0.02]} scale={[1, 1.4, 0.5]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={color} emissive={eyeColor} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.12, 0, -0.03]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  )
}

function MouthMesh({ style }: { style: string }) {
  switch (style) {
    case 'smile':
      return (
        <group position={[0, 0.3, -0.5]}>
          {[-0.08, -0.04, 0, 0.04, 0.08].map((x, i) => (
            <mesh key={i} position={[x, -Math.abs(x) * 0.4, 0]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#222222" />
            </mesh>
          ))}
        </group>
      )
    case 'open':
      return (
        <mesh position={[0, 0.3, -0.5]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#330000" />
        </mesh>
      )
    case 'surprised':
      return (
        <mesh position={[0, 0.3, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.04, 0.015, 8, 16]} />
          <meshBasicMaterial color="#222222" />
        </mesh>
      )
    case 'flat':
      return (
        <mesh position={[0, 0.3, -0.5]}>
          <boxGeometry args={[0.12, 0.015, 0.015]} />
          <meshBasicMaterial color="#222222" />
        </mesh>
      )
    case 'grin':
      return (
        <group position={[0, 0.3, -0.5]}>
          {[-0.1, -0.05, 0, 0.05, 0.1].map((x, i) => (
            <mesh key={i} position={[x, -Math.abs(x) * 0.25, 0]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#222222" />
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
    <group rotation={[0, Math.PI, 0]}>
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
        <directionalLight position={[0, 1, 3]} intensity={0.5} />
        <AvatarModel skinColor={skinColor} hairStyle={hairStyle} hairColor={hairColor} eyeColor={eyeColor} mouthStyle={mouthStyle} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  )
}
