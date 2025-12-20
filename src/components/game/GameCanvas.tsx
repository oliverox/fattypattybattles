import { Canvas } from '@react-three/fiber'
import { Scene } from './Scene'
import { COLORS } from '@/lib/game/constants'

export function GameCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 5, 15], fov: 60 }}
      className="w-full h-full"
      gl={{
        powerPreference: 'high-performance',
        antialias: true,
        alpha: false,
      }}
      shadows
    >
      <color attach="background" args={[COLORS.darkPurple]} />
      <Scene />
    </Canvas>
  )
}
