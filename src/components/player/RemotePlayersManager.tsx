import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { RemotePlayer } from './RemotePlayer'

interface RemotePlayersManagerProps {
  mapId: string
}

export function RemotePlayersManager({ mapId }: RemotePlayersManagerProps) {
  const onlinePlayers = useQuery(api.multiplayer.getOnlinePlayers, { mapId })

  if (!onlinePlayers) {
    return null
  }

  return (
    <>
      {onlinePlayers.map((player) => (
        <RemotePlayer
          key={player.userId}
          username={player.username}
          position={{ x: player.x, y: player.y, z: player.z }}
          rotation={player.rotation}
          avatarConfig={player.avatarConfig}
        />
      ))}
    </>
  )
}
