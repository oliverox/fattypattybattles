import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Group, Color } from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { COLORS } from '@/lib/game/constants'

interface ShopBuildingProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export function ShopBuilding({ position = [0, 0, 0], rotation = [0, 0, 0] }: ShopBuildingProps) {
  const signRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    if (signRef.current) {
      // Pulse the sign by scaling slightly
      const pulse = 1 + Math.sin(clock.elapsedTime * 2) * 0.05
      signRef.current.scale.set(pulse, pulse, 1)
    }
  })

  return (
    <RigidBody type="fixed" position={position} rotation={rotation}>
      <CuboidCollider args={[4, 5, 4]} position={[0, 5, 0]} />
      <group>
        {/* Main building body */}
        <mesh position={[0, 5, 0]} castShadow receiveShadow>
          <boxGeometry args={[8, 10, 8]} />
          <meshStandardMaterial color={COLORS.darkPurple} />
        </mesh>

        {/* Neon outline strips - vertical corners */}
        {([
          [-4, -4],
          [4, -4],
          [-4, 4],
          [4, 4],
        ] as const).map(([x, z], i) => (
          <mesh key={`v${i}`} position={[x, 5, z]}>
            <boxGeometry args={[0.2, 10, 0.2]} />
            <meshBasicMaterial color={COLORS.neonCyan} />
          </mesh>
        ))}

        {/* Horizontal neon strips at top and bottom */}
        {[0.1, 10].map((y, i) => (
          <group key={`h${i}`}>
            <mesh position={[0, y, 4]}>
              <boxGeometry args={[8, 0.2, 0.1]} />
              <meshBasicMaterial color={COLORS.neonPink} />
            </mesh>
            <mesh position={[0, y, -4]}>
              <boxGeometry args={[8, 0.2, 0.1]} />
              <meshBasicMaterial color={COLORS.neonPink} />
            </mesh>
            <mesh position={[4, y, 0]}>
              <boxGeometry args={[0.1, 0.2, 8]} />
              <meshBasicMaterial color={COLORS.neonPink} />
            </mesh>
            <mesh position={[-4, y, 0]}>
              <boxGeometry args={[0.1, 0.2, 8]} />
              <meshBasicMaterial color={COLORS.neonPink} />
            </mesh>
          </group>
        ))}

        {/* Shop counter window */}
        <mesh position={[0, 3, 4.1]}>
          <planeGeometry args={[5, 4]} />
          <meshStandardMaterial
            color={COLORS.neonCyan}
            emissive={new Color(COLORS.neonCyan)}
            emissiveIntensity={0.3}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* BUY sign on roof */}
        <group position={[0, 12, 0]}>
          {/* Sign backing */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[6, 2.5, 0.5]} />
            <meshStandardMaterial color={COLORS.darkPurple} />
          </mesh>

          {/* Neon BUY text */}
          <Text
            ref={signRef}
            position={[0, 0, 0.3]}
            fontSize={1.8}
            color={COLORS.neonPink}
            anchorX="center"
            anchorY="middle"
          >
            BUY
            <meshBasicMaterial color={COLORS.neonPink} toneMapped={false} />
          </Text>

          {/* Sign frame */}
          <mesh position={[0, 1.35, 0]}>
            <boxGeometry args={[6.2, 0.15, 0.6]} />
            <meshBasicMaterial color={COLORS.neonCyan} />
          </mesh>
          <mesh position={[0, -1.35, 0]}>
            <boxGeometry args={[6.2, 0.15, 0.6]} />
            <meshBasicMaterial color={COLORS.neonCyan} />
          </mesh>
          <mesh position={[-3.05, 0, 0]}>
            <boxGeometry args={[0.15, 2.5, 0.6]} />
            <meshBasicMaterial color={COLORS.neonCyan} />
          </mesh>
          <mesh position={[3.05, 0, 0]}>
            <boxGeometry args={[0.15, 2.5, 0.6]} />
            <meshBasicMaterial color={COLORS.neonCyan} />
          </mesh>

          {/* Sign poles */}
          <mesh position={[-2, -1.25, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 2.5]} />
            <meshBasicMaterial color={COLORS.neonCyan} />
          </mesh>
          <mesh position={[2, -1.25, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 2.5]} />
            <meshBasicMaterial color={COLORS.neonCyan} />
          </mesh>
        </group>
      </group>
    </RigidBody>
  )
}
