import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { NeonGrid } from './NeonGrid'
import { SynthwaveSky } from './SynthwaveSky'
import { ReflectiveFloor } from './ReflectiveFloor'
import { NeonPyramid } from './structures/NeonPyramid'
import { NeonObelisk } from './structures/NeonObelisk'
import { RetroBuilding } from './structures/RetroBuilding'
import { NeonPalmTree } from './structures/NeonPalmTree'
import { FloatingShapes } from './structures/FloatingShapes'
import { COLORS } from '@/lib/game/constants'

export function SynthwaveEnvironment() {
  return (
    <group>
      {/* Sky and atmosphere */}
      <SynthwaveSky />
      <fog attach="fog" args={[COLORS.darkPurple, 30, 150]} />

      {/* Ground */}
      <ReflectiveFloor />
      <NeonGrid />

      {/* Static ground collider */}
      <RigidBody type="fixed" position={[0, -0.1, 0]}>
        <CuboidCollider args={[100, 0.1, 100]} />
      </RigidBody>

      {/* Central Pyramid */}
      <NeonPyramid position={[0, 0, -30]} scale={3} />

      {/* Corner obelisks */}
      <NeonObelisk position={[-25, 0, -25]} />
      <NeonObelisk position={[25, 0, -25]} />
      <NeonObelisk position={[-25, 0, 25]} />
      <NeonObelisk position={[25, 0, 25]} />

      {/* Buildings along edges */}
      <RetroBuilding position={[-40, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <RetroBuilding position={[40, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <RetroBuilding position={[0, 0, 40]} rotation={[0, Math.PI, 0]} />

      {/* Palm trees scattered around plaza */}
      <NeonPalmTree position={[-12, 0, 12]} />
      <NeonPalmTree position={[12, 0, 12]} />
      <NeonPalmTree position={[-12, 0, -12]} />
      <NeonPalmTree position={[12, 0, -12]} />
      <NeonPalmTree position={[-18, 0, 0]} />
      <NeonPalmTree position={[18, 0, 0]} />

      {/* Floating shapes above the plaza */}
      <FloatingShapes />
    </group>
  )
}
