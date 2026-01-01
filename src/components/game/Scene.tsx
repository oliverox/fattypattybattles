import { Suspense } from 'react'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { controlsMap } from '@/lib/game/controls'
import { PHYSICS, COLORS, MULTIPLAYER } from '@/lib/game/constants'
import { PlayerController } from '@/components/player/PlayerController'
import { RemotePlayersManager } from '@/components/player/RemotePlayersManager'
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
          {/* Ambient lighting */}
          <ambientLight intensity={0.4} color="#ffffff" />

          {/* Sun light with shadows */}
          <directionalLight
            position={[50, 100, 50]}
            intensity={1}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={200}
            shadow-camera-left={-100}
            shadow-camera-right={100}
            shadow-camera-top={100}
            shadow-camera-bottom={-100}
            shadow-bias={-0.0001}
          />

          {/* Player */}
          <PlayerController avatarConfig={avatarConfig} />

          {/* Remote Players (Multiplayer) */}
          <RemotePlayersManager mapId={MULTIPLAYER.defaultMapId} />

          {/* Environment */}
          <SynthwaveEnvironment />
        </Physics>
      </Suspense>

      {/* Post-processing effects */}
      <PostProcessing />
    </KeyboardControls>
  )
}
