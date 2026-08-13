import { Prisma } from "@prisma/client"
import type { DiscoverySortValue } from "./discovery-query"

export type DiscoverySort = DiscoverySortValue

export function getDiscoveryOrderBy(sort: DiscoverySort): Prisma.GameOrderByWithRelationInput[] {
  switch (sort) {
    case "new":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }]
    case "popular":
      return [{ likes: "desc" }, { plays: "desc" }, { publishedAt: "desc" }]
    case "top":
      return [{ avgRating: "desc" }, { plays: "desc" }, { likes: "desc" }]
    case "trending":
    default:
      return [{ plays: "desc" }, { likes: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }]
  }
}
