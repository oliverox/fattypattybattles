import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, type RapierRigidBody, useRapier } from '@react-three/rapier'
import { Vector3 } from 'three'
import { Controls } from '@/lib/game/controls'
import { PHYSICS, CAMERA, SHOP, SELL_NPC, BATTLE_NPC, MULTIPLAYER } from '@/lib/game/constants'
import { PlayerMesh, type AvatarConfig } from './PlayerMesh'
import { ThirdPersonCamera } from './ThirdPersonCamera'
import { useGameStore } from '@/stores/gameStore'
import { usePositionSync } from '@/hooks/usePositionSync'

interface PlayerControllerProps {
  avatarConfig?: AvatarConfig
}

export function PlayerController({ avatarConfig }: PlayerControllerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const [, getKeys] = useKeyboardControls<Controls>()
  const { world } = useRapier()
  const { syncPosition } = usePositionSync(MULTIPLAYER.defaultMapId)

  // Movement direction vector (reused to avoid allocations)
  const direction = useRef(new Vector3())
  // Camera orbit angle (Q/E rotates camera around player)
  // Start facing +z direction (towards buy/sell shops at z=20)
  const orbitAngle = useRef(Math.PI)
  // Camera zoom distance (I/O to zoom in/out)
  const zoomDistance = useRef(CAMERA.distance)
  // Track if jump key was pressed last frame (to prevent holding jump)
  const jumpPressed = useRef(false)
  // Track if interact key was pressed last frame
  const interactPressed = useRef(false)
  // Track if inventory key was pressed last frame
  const inventoryPressed = useRef(false)
  // Track if chat key was pressed last frame
  const chatPressed = useRef(false)
  // Track if leaderboard key was pressed last frame
  const leaderboardPressed = useRef(false)
  // NPC positions for proximity check
  const npcPosition = useRef(new Vector3(...SHOP.npcPosition))
  const sellNpcPosition = useRef(new Vector3(...SELL_NPC.npcPosition))
  const battleNpcPosition = useRef(new Vector3(...BATTLE_NPC.npcPosition))

  useFrame(() => {
    if (!rigidBodyRef.current) return

    const keys = getKeys()
    const state = useGameStore.getState()
    const {
      dialogueOpen, shopOpen, nearNPC, setNearNPC, setDialogueOpen,
      nearSellNPC, setNearSellNPC, setSellDialogueOpen,
      sellDialogueOpen, sellShopOpen, inventoryOpen, setInventoryOpen,
      nearBattleNPC, setNearBattleNPC, setBattleDialogueOpen,
      battleDialogueOpen, battleCardSelectOpen, battleArenaOpen,
      chatOpen, setChatOpen, leaderboardOpen, setLeaderboardOpen,
      pvpRequestDialogOpen, pvpIncomingDialogOpen, pvpWaitingForOpponent,
      touchInput,
      shouldRespawn, setShouldRespawn, setLastMovementTime
    } = state

    // Handle respawn when returning to tab
    if (shouldRespawn) {
      rigidBodyRef.current.setTranslation({ x: 0, y: 3, z: 0 }, true)
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      orbitAngle.current = Math.PI // Face the shops
      setShouldRespawn(false)
    }

    // Combine keyboard and touch input
    const forward = keys.forward || touchInput.forward
    const backward = keys.backward || touchInput.backward
    const left = keys.left || touchInput.left
    const right = keys.right || touchInput.right
    const rotateLeft = keys.rotateLeft || touchInput.turnLeft
    const rotateRight = keys.rotateRight || touchInput.turnRight
    const jump = keys.jump || touchInput.jump
    const zoomIn = keys.zoomIn || touchInput.zoomIn
    const zoomOut = keys.zoomOut || touchInput.zoomOut
    const interact = keys.interact || touchInput.interact
    const inventory = keys.inventory
    const chat = keys.chat || touchInput.chat
    const leaderboard = keys.leaderboard

    // Check proximity to Shop NPC
    const position = rigidBodyRef.current.translation()
    const playerPos = new Vector3(position.x, position.y, position.z)
    const distanceToNPC = playerPos.distanceTo(npcPosition.current)
    const isNearNPC = distanceToNPC < SHOP.interactionDistance

    if (isNearNPC !== nearNPC) {
      setNearNPC(isNearNPC)
    }

    // Check proximity to Sell NPC
    const distanceToSellNPC = playerPos.distanceTo(sellNpcPosition.current)
    const isNearSellNPC = distanceToSellNPC < SELL_NPC.interactionDistance

    if (isNearSellNPC !== nearSellNPC) {
      setNearSellNPC(isNearSellNPC)
    }

    // Check proximity to Battle NPC
    const distanceToBattleNPC = playerPos.distanceTo(battleNpcPosition.current)
    const isNearBattleNPC = distanceToBattleNPC < BATTLE_NPC.interactionDistance

    if (isNearBattleNPC !== nearBattleNPC) {
      setNearBattleNPC(isNearBattleNPC)
    }

    // Sync position to server for multiplayer
    syncPosition(playerPos, orbitAngle.current)

    // Check if any UI is open
    const anyUIOpen = dialogueOpen || shopOpen || sellDialogueOpen || sellShopOpen || inventoryOpen || battleDialogueOpen || battleCardSelectOpen || battleArenaOpen || chatOpen || leaderboardOpen || pvpRequestDialogOpen || pvpIncomingDialogOpen || pvpWaitingForOpponent

    // Handle inventory key (B) - toggle inventory
    if (inventory && !inventoryPressed.current && !anyUIOpen) {
      setInventoryOpen(true)
    }
    inventoryPressed.current = inventory

    // Handle chat key (C) - toggle chat
    if (chat && !chatPressed.current && !anyUIOpen) {
      setChatOpen(true)
    }
    chatPressed.current = chat

    // Handle leaderboard key (L) - toggle leaderboard
    if (leaderboard && !leaderboardPressed.current && !anyUIOpen) {
      setLeaderboardOpen(true)
    }
    leaderboardPressed.current = leaderboard

    // Handle interact key (T) - only trigger on key down, not hold
    if (interact && !interactPressed.current && !anyUIOpen) {
      if (isNearNPC) {
        setDialogueOpen(true)
      } else if (isNearSellNPC) {
        setSellDialogueOpen(true)
      } else if (isNearBattleNPC) {
        setBattleDialogueOpen(true)
      }
    }
    interactPressed.current = interact

    // Skip movement if any UI is open
    if (anyUIOpen) {
      return
    }

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
      const rayOrigin = { x: position.x, y: position.y, z: position.z }
      const rayDir = { x: 0, y: -1, z: 0 }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rayObj = { origin: rayOrigin, dir: rayDir } as any
      const ray = world.castRay(
        rayObj,
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

      // Update last movement time for idle tracking
      setLastMovementTime(Date.now())
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
      <PlayerMesh facingAngle={orbitAngle} avatarConfig={avatarConfig} />
      <ThirdPersonCamera rigidBodyRef={rigidBodyRef} orbitAngle={orbitAngle} zoomDistance={zoomDistance} />
    </RigidBody>
  )
}
