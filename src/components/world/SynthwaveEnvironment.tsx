import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { NeonGrid } from './NeonGrid'
import { SynthwaveSky } from './SynthwaveSky'
import { ReflectiveFloor } from './ReflectiveFloor'
import { NeonPyramid } from './structures/NeonPyramid'
import { NeonObelisk } from './structures/NeonObelisk'
import { RetroBuilding } from './structures/RetroBuilding'
import { NeonPalmTree } from './structures/NeonPalmTree'
import { FloatingShapes } from './structures/FloatingShapes'
import { ShopBuilding } from './structures/ShopBuilding'
import { SellBuilding } from './structures/SellBuilding'
import { BattleArenaStructure } from './structures/BattleArenaStructure'
import { Shopkeeper } from './npc/Shopkeeper'
import { SellNPC } from './npc/SellNPC'
import { BattleNPC } from './npc/BattleNPC'
import { COLORS, SHOP, SELL_NPC, BATTLE_NPC } from '@/lib/game/constants'

export function SynthwaveEnvironment() {
  return (
    <group>
      {/* Sky and atmosphere */}
      <SynthwaveSky />
      <fog attach="fog" args={['#87CEEB', 50, 200]} />

      {/* Ground */}
      <ReflectiveFloor />

      {/* Static ground collider */}
      <RigidBody type="fixed" position={[0, -0.1, 0]}>
        <CuboidCollider args={[100, 0.1, 100]} />
      </RigidBody>

      {/* Invisible boundary walls at map edges */}
      {/* North wall (positive Z) */}
      <RigidBody type="fixed" position={[0, 10, 100]}>
        <CuboidCollider args={[100, 10, 0.5]} />
      </RigidBody>
      {/* South wall (negative Z) */}
      <RigidBody type="fixed" position={[0, 10, -100]}>
        <CuboidCollider args={[100, 10, 0.5]} />
      </RigidBody>
      {/* East wall (positive X) */}
      <RigidBody type="fixed" position={[100, 10, 0]}>
        <CuboidCollider args={[0.5, 10, 100]} />
      </RigidBody>
      {/* West wall (negative X) */}
      <RigidBody type="fixed" position={[-100, 10, 0]}>
        <CuboidCollider args={[0.5, 10, 100]} />
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

      {/* Shop building and NPC */}
      <ShopBuilding position={[SHOP.npcPosition[0], 0, SHOP.npcPosition[2] + 6]} />
      <Shopkeeper position={SHOP.npcPosition} />

      {/* Sell building and NPC */}
      <SellBuilding position={[SELL_NPC.npcPosition[0], 0, SELL_NPC.npcPosition[2] + 6]} />
      <SellNPC position={SELL_NPC.npcPosition} />

      {/* Battle arena and NPC */}
      <BattleArenaStructure position={[BATTLE_NPC.npcPosition[0], 0, BATTLE_NPC.npcPosition[2] + 6]} />
      <BattleNPC position={BATTLE_NPC.npcPosition} />
    </group>
  )
}
