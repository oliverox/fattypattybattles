import { MeshReflectorMaterial } from '@react-three/drei'
import { COLORS } from '@/lib/game/constants'

export function ReflectiveFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[200, 200]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={512}
        mixBlur={1}
        mixStrength={40}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color={COLORS.darkPurple}
        metalness={0.5}
        mirror={0.5}
      />
    </mesh>
  )
}
