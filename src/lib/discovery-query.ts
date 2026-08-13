import { CATEGORIES } from "./utils"

export const DISCOVERY_SORTS = ["trending", "new", "popular", "top"] as const
export const MAX_DISCOVERY_PAGE = 500
export const MAX_DISCOVERY_PAGE_SIZE = 50
export const MAX_DISCOVERY_SEARCH_LENGTH = 80

export type DiscoverySortValue = (typeof DISCOVERY_SORTS)[number]

type DiscoveryFilterInput = {
  category?: string | null
  sort?: string | null
  search?: string | null
  mobile?: string | boolean | null
  editor?: string | boolean | null
}

const validCategories = new Set(
  CATEGORIES.map((category) => category.value.toLowerCase())
)

function isEnabled(value: string | boolean | null | undefined) {
  return value === true || (typeof value === "string" && value.trim().toLowerCase() === "true")
}

export function normalizeDiscoveryFilters(input: DiscoveryFilterInput) {
  const requestedCategory = input.category?.trim().toLowerCase() || "all"
  const category = validCategories.has(requestedCategory) ? requestedCategory : "all"
  const requestedSort = input.sort?.trim().toLowerCase()
  const sort = DISCOVERY_SORTS.includes(requestedSort as DiscoverySortValue)
    ? (requestedSort as DiscoverySortValue)
    : "trending"
  const search = input.search?.trim().slice(0, MAX_DISCOVERY_SEARCH_LENGTH) || ""

  return {
    category,
    sort,
    search,
    supportsMobile: isEnabled(input.mobile),
    hasLevelEditor: isEnabled(input.editor),
  }
}

export function normalizeDiscoveryPage(value: string | null | undefined) {
  const parsed = Number.parseInt(value || "1", 10)
  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(parsed, MAX_DISCOVERY_PAGE)
    : 1
}

export function normalizeDiscoveryPageSize(
  value: string | null | undefined,
  fallback = 20
) {
  const parsed = Number.parseInt(value || String(fallback), 10)
  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(parsed, MAX_DISCOVERY_PAGE_SIZE)
    : fallback
}
