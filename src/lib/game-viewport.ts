export interface GameViewport {
  width: number
  height: number
}

/** Keep the game's own viewport stable while fitting its entire surface on screen. */
export function getContainedGameViewport(
  game: GameViewport,
  container: GameViewport,
  rotated = false
) {
  const valid = [game.width, game.height, container.width, container.height]
    .every((value) => Number.isFinite(value) && value > 0)

  if (!valid) return null

  const displayedWidth = rotated ? game.height : game.width
  const displayedHeight = rotated ? game.width : game.height
  const scale = Math.min(container.width / displayedWidth, container.height / displayedHeight)

  return {
    width: game.width,
    height: game.height,
    left: (container.width - game.width) / 2,
    top: (container.height - game.height) / 2,
    scale,
    transform: `${rotated ? "rotate(90deg) " : ""}scale(${scale})`,
  }
}
