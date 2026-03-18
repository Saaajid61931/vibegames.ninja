export function countUniqueCreators(creatorUserIds: string[], studioOwnerIds: string[]) {
  return new Set([...creatorUserIds, ...studioOwnerIds]).size
}
