import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { LineSegments, LineBasicMaterial, ConeGeometry } from 'three'
import { RigidBody, ConeCollider } from '@react-three/rapier'
import { COLORS } from '@/lib/game/constants'

interface NeonPyramidProps {
  position?: [number, number, number]
  scale?: number
}

export function NeonPyramid({ position = [0, 0, 0], scale = 1 }: NeonPyramidProps) {
  const edgesRef = useRef<LineSegments>(null)

  useFrame(({ clock }) => {
    if (edgesRef.current) {
      const material = edgesRef.current.material as LineBasicMaterial
      const pulse = Math.sin(clock.elapsedTime * 2) * 0.5 + 1
      material.opacity = 0.5 + pulse * 0.5
    }
  })

  return (
    <RigidBody type="fixed" position={position}>
      <ConeCollider args={[5 * scale, 5 * scale]} position={[0, 5 * scale, 0]} />
      <group scale={scale}>
        {/* Solid pyramid base */}
        <mesh position={[0, 5, 0]} castShadow receiveShadow>
          <coneGeometry args={[5, 10, 4]} />
          <meshStandardMaterial
            color={COLORS.darkPurple}
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Neon edges */}
        <lineSegments ref={edgesRef} position={[0, 5, 0]}>
          <edgesGeometry args={[new ConeGeometry(5, 10, 4)]} />
          <lineBasicMaterial
            color={COLORS.neonPink}
            transparent
            opacity={1}
          />
        </lineSegments>

        {/* Inner glow pyramid */}
        <mesh position={[0, 5, 0]} scale={0.9}>
          <coneGeometry args={[5, 10, 4]} />
          <meshBasicMaterial
            color={COLORS.neonPink}
            transparent
            opacity={0.1}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}
