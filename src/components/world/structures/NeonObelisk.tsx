import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, Color } from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { COLORS } from '@/lib/game/constants'

interface NeonObeliskProps {
  position?: [number, number, number]
}

export function NeonObelisk({ position = [0, 0, 0] }: NeonObeliskProps) {
  const glowRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (glowRef.current) {
      const pulse = Math.sin(clock.elapsedTime * 1.5) * 0.5 + 1
      const material = glowRef.current.material as any
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = pulse
      }
    }
  })

  return (
    <RigidBody type="fixed" position={position}>
      <CuboidCollider args={[1, 10, 1]} position={[0, 10, 0]} />
      <group>
        {/* Main obelisk body */}
        <mesh position={[0, 10, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 20, 2]} />
          <meshStandardMaterial color={COLORS.darkPurple} />
        </mesh>

        {/* Pointed top */}
        <mesh position={[0, 21, 0]} castShadow>
          <coneGeometry args={[1.4, 2, 4]} />
          <meshStandardMaterial color={COLORS.darkPurple} />
        </mesh>

        {/* Neon strip running up the side */}
        <mesh position={[1.05, 10, 0]} ref={glowRef}>
          <boxGeometry args={[0.1, 20, 0.5]} />
          <meshStandardMaterial
            color={COLORS.neonCyan}
            emissive={new Color(COLORS.neonCyan)}
            emissiveIntensity={1}
          />
        </mesh>

        {/* Neon strip on opposite side */}
        <mesh position={[-1.05, 10, 0]}>
          <boxGeometry args={[0.1, 20, 0.5]} />
          <meshStandardMaterial
            color={COLORS.neonPink}
            emissive={new Color(COLORS.neonPink)}
            emissiveIntensity={0.8}
          />
        </mesh>

        {/* Neon ring at base */}
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2, 0.1, 8, 4]} />
          <meshBasicMaterial color={COLORS.neonPink} />
        </mesh>
      </group>
    </RigidBody>
  )
}
