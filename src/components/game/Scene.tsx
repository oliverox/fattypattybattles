import { Suspense } from 'react'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { controlsMap } from '@/lib/game/controls'
import { PHYSICS, COLORS } from '@/lib/game/constants'
import { PlayerController } from '@/components/player/PlayerController'
import { SynthwaveEnvironment } from '@/components/world/SynthwaveEnvironment'
import { PostProcessing } from './PostProcessing'
import type { AvatarConfig } from '@/components/player/PlayerMesh'

interface SceneProps {
  avatarConfig?: AvatarConfig
}

export function Scene({ avatarConfig }: SceneProps) {
  return (
    <KeyboardControls map={controlsMap}>
      <Suspense fallback={null}>
        <Physics gravity={[PHYSICS.gravity.x, PHYSICS.gravity.y, PHYSICS.gravity.z]}>
          {/* Ambient lighting with purple tint */}
          <ambientLight intensity={0.3} color={COLORS.neonPurple} />

          {/* Sun light from horizon */}
          <directionalLight
            position={[0, 50, -100]}
            intensity={0.5}
            color={COLORS.sunOrange}
          />

          {/* Player */}
          <PlayerController avatarConfig={avatarConfig} />

          {/* Environment */}
          <SynthwaveEnvironment />
        </Physics>
      </Suspense>

      {/* Post-processing effects */}
      <PostProcessing />
    </KeyboardControls>
  )
}
