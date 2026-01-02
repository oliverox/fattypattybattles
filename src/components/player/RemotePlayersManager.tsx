import { useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { RemotePlayer } from './RemotePlayer'
import { useGameStore } from '@/stores/gameStore'

interface RemotePlayersManagerProps {
  mapId: string
}

export function RemotePlayersManager({ mapId }: RemotePlayersManagerProps) {
  const onlinePlayers = useQuery(api.multiplayer.getOnlinePlayers, { mapId })
  const setPvpTargetPlayer = useGameStore((state) => state.setPvpTargetPlayer)
  const setPvpRequestDialogOpen = useGameStore((state) => state.setPvpRequestDialogOpen)

  const handlePlayerClick = useCallback((userId: string, username: string) => {
    setPvpTargetPlayer({ userId, username })
    setPvpRequestDialogOpen(true)
  }, [setPvpTargetPlayer, setPvpRequestDialogOpen])

  if (!onlinePlayers) {
    return null
  }

  return (
    <>
      {onlinePlayers.map((player) => (
        <RemotePlayer
          key={player.userId}
          userId={player.userId}
          username={player.username}
          position={{ x: player.x, y: player.y, z: player.z }}
          rotation={player.rotation}
          avatarConfig={player.avatarConfig}
          onPlayerClick={handlePlayerClick}
        />
      ))}
    </>
  )
}
