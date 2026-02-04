import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS } from '@/lib/game/constants'

interface MountainRangeProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  length?: number
}

// Generate a single mountain peak
function MountainPeak({
  position,
  height,
  baseWidth
}: {
  position: [number, number, number]
  height: number
  baseWidth: number
}) {
  return (
    <group position={position}>
      {/* Main mountain body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[baseWidth, height, 6]} />
        <meshStandardMaterial
          color="#3d1a5c"
          roughness={0.7}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Snow cap */}
      <mesh position={[0, height * 0.75, 0]} castShadow>
        <coneGeometry args={[baseWidth * 0.4, height * 0.35, 6]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.5}
          metalness={0.3}
          emissive="#8080ff"
          emissiveIntensity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Neon accent line at base */}
      <mesh position={[0, 0.5, 0]}>
        <torusGeometry args={[baseWidth * 0.9, 0.15, 8, 24]} />
        <meshBasicMaterial
          color={COLORS.neonCyan}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  )
}

export function MountainRange({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  length = 200
}: MountainRangeProps) {
  // Generate procedural mountains along the range
  const mountains = useMemo(() => {
    const peaks: { x: number; height: number; width: number }[] = []
    let x = -length / 2

    while (x < length / 2) {
      const height = 25 + Math.random() * 35 // 25-60 units tall
      const width = 12 + Math.random() * 10 // 12-22 units wide
      peaks.push({ x, height, width })
      x += width * 1.2 + Math.random() * 5 // Space between peaks
    }

    return peaks
  }, [length])

  return (
    <group position={position} rotation={rotation}>
      {/* Background layer - distant mountains */}
      <group position={[0, 0, 8]}>
        {mountains.map((peak, i) => (
          <MountainPeak
            key={`bg-${i}`}
            position={[peak.x + 5, 0, 0]}
            height={peak.height * 0.7}
            baseWidth={peak.width * 0.8}
          />
        ))}
      </group>

      {/* Main layer */}
      {mountains.map((peak, i) => (
        <MountainPeak
          key={`main-${i}`}
          position={[peak.x, 0, 0]}
          height={peak.height}
          baseWidth={peak.width}
        />
      ))}

      {/* Foreground layer - smaller peaks */}
      <group position={[0, 0, -6]}>
        {mountains.filter((_, i) => i % 2 === 0).map((peak, i) => (
          <MountainPeak
            key={`fg-${i}`}
            position={[peak.x - 8, 0, 0]}
            height={peak.height * 0.5}
            baseWidth={peak.width * 0.6}
          />
        ))}
      </group>
    </group>
  )
}
