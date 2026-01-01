import { Grid } from '@react-three/drei'
import { COLORS } from '@/lib/game/constants'

export function NeonGrid() {
  return (
    <Grid
      position={[0, 0.05, 0]}
      args={[200, 200]}
      cellSize={2}
      cellThickness={1}
      cellColor={COLORS.neonPink}
      sectionSize={10}
      sectionThickness={1.5}
      sectionColor={COLORS.neonCyan}
      fadeDistance={100}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid
    />
  )
}
