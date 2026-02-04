import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS } from '@/lib/game/constants'

interface MountainRangeProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  length?: number
}

export function MountainRange({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  length = 200
}: MountainRangeProps) {
  // Generate mountain positions along the range
  const mountains = useMemo(() => {
    const peaks: { x: number; height: number; width: number }[] = []
    const count = 12
    const spacing = length / count

    for (let i = 0; i < count; i++) {
      const x = -length / 2 + i * spacing + spacing / 2
      const height = 30 + Math.sin(i * 1.5) * 15 // 15-45 units tall
      const width = 15 + Math.cos(i * 0.8) * 5 // 10-20 units wide
      peaks.push({ x, height, width })
    }

    return peaks
  }, [length])

  return (
    <group position={position} rotation={rotation}>
      {mountains.map((peak, i) => (
        <group key={i} position={[peak.x, 0, 0]}>
          {/* Main mountain body */}
          <mesh position={[0, peak.height / 2, 0]} castShadow receiveShadow>
            <coneGeometry args={[peak.width, peak.height, 5]} />
            <meshStandardMaterial
              color="#4a2070"
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Snow cap */}
          <mesh position={[0, peak.height * 0.8, 0]}>
            <coneGeometry args={[peak.width * 0.35, peak.height * 0.3, 5]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#6060ff"
              emissiveIntensity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Neon glow at base */}
          <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[peak.width * 0.8, peak.width * 0.95, 16]} />
            <meshBasicMaterial
              color={COLORS.neonCyan}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
