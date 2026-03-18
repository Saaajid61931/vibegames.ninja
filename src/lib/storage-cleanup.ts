import {
  deleteAllObjectsUnderPrefix,
  deleteObjectsByPredicate,
} from "./storage-r2"

function isRootThumbnailAsset(key: string, prefix: string): boolean {
  if (!key.startsWith(prefix)) {
    return false
  }

  const relativePath = key.slice(prefix.length)
  return /^thumbnail(?:-\d+)?(?:-w\d+)?\.[^/]+$/i.test(relativePath)
}

function isRootUserAvatarAsset(key: string, prefix: string): boolean {
  if (!key.startsWith(prefix)) {
    return false
  }

  const relativePath = key.slice(prefix.length)
  return /^avatar\.[^/]+$/i.test(relativePath)
}

function isRootJamBannerAsset(key: string, prefix: string): boolean {
  if (!key.startsWith(prefix)) {
    return false
  }

  const relativePath = key.slice(prefix.length)
  return /^banner\.[^/]+$/i.test(relativePath)
}

export async function deleteGameThumbnailAssetsFromR2(gameId: string): Promise<number> {
  const prefix = `games/${gameId}/`
  return deleteObjectsByPredicate(prefix, (key) => isRootThumbnailAsset(key, prefix))
}

export async function deleteUserAvatarAssetsFromR2(userId: string): Promise<number> {
  const prefix = `users/${userId}/`
  return deleteObjectsByPredicate(prefix, (key) => isRootUserAvatarAsset(key, prefix))
}

export async function deleteJamBannerAssetsFromR2(jamId: string): Promise<number> {
  const prefix = `jams/${jamId}/`
  return deleteObjectsByPredicate(prefix, (key) => isRootJamBannerAsset(key, prefix))
}

export async function deleteStaleGameAssetsFromR2(gameId: string, keepKeys: string[]): Promise<number> {
  const prefix = `games/${gameId}/`
  const keepSet = new Set(keepKeys)

  return deleteObjectsByPredicate(
    prefix,
    (key) => !keepSet.has(key) && !isRootThumbnailAsset(key, prefix)
  )
}

export async function deleteGameAssetsFromR2(gameId: string): Promise<number> {
  return deleteAllObjectsUnderPrefix(`games/${gameId}/`)
}
