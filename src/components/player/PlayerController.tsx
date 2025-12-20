import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, type RapierRigidBody, useRapier } from '@react-three/rapier'
import { Vector3 } from 'three'
import { Controls } from '@/lib/game/controls'
import { PHYSICS, CAMERA } from '@/lib/game/constants'
import { PlayerMesh } from './PlayerMesh'
import { ThirdPersonCamera } from './ThirdPersonCamera'

export function PlayerController() {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const [, getKeys] = useKeyboardControls<Controls>()
  const { world } = useRapier()

  // Movement direction vector (reused to avoid allocations)
  const direction = useRef(new Vector3())
  // Camera orbit angle (Q/E rotates camera around player)
  const orbitAngle = useRef(0)
  // Camera zoom distance (I/O to zoom in/out)
  const zoomDistance = useRef(CAMERA.distance)
  // Track if jump key was pressed last frame (to prevent holding jump)
  const jumpPressed = useRef(false)

  useFrame(() => {
    if (!rigidBodyRef.current) return

    const { forward, backward, left, right, rotateLeft, rotateRight, jump, zoomIn, zoomOut } = getKeys()

    // Handle camera orbit with Q/E keys
    const rotationSpeed = 0.05
    if (rotateLeft) orbitAngle.current += rotationSpeed
    if (rotateRight) orbitAngle.current -= rotationSpeed

    // Handle zoom with I/O keys
    const zoomSpeed = 0.2
    const minZoom = 4
    const maxZoom = 30
    if (zoomIn) zoomDistance.current = Math.max(minZoom, zoomDistance.current - zoomSpeed)
    if (zoomOut) zoomDistance.current = Math.min(maxZoom, zoomDistance.current + zoomSpeed)

    // Handle jump
    if (jump && !jumpPressed.current) {
      const position = rigidBodyRef.current.translation()
      // Simple ground check: raycast downward
      const ray = world.castRay(
        { origin: { x: position.x, y: position.y, z: position.z }, dir: { x: 0, y: -1, z: 0 } },
        1.5, // Max distance to check
        true, // Solid
        undefined,
        undefined,
        undefined,
        rigidBodyRef.current // Exclude self
      )

      if (ray) {
        // On ground, can jump
        const currentVel = rigidBodyRef.current.linvel()
        rigidBodyRef.current.setLinvel(
          { x: currentVel.x, y: PHYSICS.playerJumpForce, z: currentVel.z },
          true
        )
      }
    }
    jumpPressed.current = jump

    // Calculate movement direction relative to camera angle
    direction.current.set(0, 0, 0)
    if (forward) direction.current.z -= 1
    if (backward) direction.current.z += 1
    if (left) direction.current.x -= 1
    if (right) direction.current.x += 1

    // Normalize and apply speed
    if (direction.current.length() > 0) {
      direction.current.normalize()

      // Rotate movement direction by camera's orbit angle
      const cos = Math.cos(orbitAngle.current)
      const sin = Math.sin(orbitAngle.current)
      const rotatedX = direction.current.x * cos - direction.current.z * sin
      const rotatedZ = direction.current.x * sin + direction.current.z * cos

      // Apply velocity (preserve Y velocity for gravity)
      const currentVel = rigidBodyRef.current.linvel()
      rigidBodyRef.current.setLinvel(
        {
          x: rotatedX * PHYSICS.playerSpeed,
          y: currentVel.y,
          z: rotatedZ * PHYSICS.playerSpeed
        },
        true
      )
    }
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 3, 0]}
      enabledRotations={[false, false, false]}
      linearDamping={PHYSICS.linearDamping}
      colliders={false}
    >
      <CapsuleCollider args={[0.5, 0.5]} />
      <PlayerMesh />
      <ThirdPersonCamera rigidBodyRef={rigidBodyRef} orbitAngle={orbitAngle} zoomDistance={zoomDistance} />
    </RigidBody>
  )
}
