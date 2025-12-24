import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { RapierRigidBody } from '@react-three/rapier'
import { CAMERA } from '@/lib/game/constants'

interface ThirdPersonCameraProps {
  rigidBodyRef: React.RefObject<RapierRigidBody | null>
  orbitAngle: React.RefObject<number>
  zoomDistance: React.RefObject<number>
}

export function ThirdPersonCamera({ rigidBodyRef, orbitAngle, zoomDistance }: ThirdPersonCameraProps) {
  const { camera } = useThree()
  const targetPosition = useRef(new Vector3())
  const lookAtPosition = useRef(new Vector3())

  useFrame(() => {
    if (!rigidBodyRef.current) return

    const playerPos = rigidBodyRef.current.translation()
    const angle = orbitAngle.current
    const distance = zoomDistance.current

    // Calculate target camera position (always behind the player)
    // Player faces direction (sin(angle), -cos(angle)), so camera should be opposite
    targetPosition.current.set(
      playerPos.x - Math.sin(angle) * distance,
      playerPos.y + CAMERA.height,
      playerPos.z + Math.cos(angle) * distance
    )

    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition.current, CAMERA.smoothness)

    // Look at player (slightly above center)
    lookAtPosition.current.set(playerPos.x, playerPos.y + 1, playerPos.z)
    camera.lookAt(lookAtPosition.current)
  })

  return null
}
