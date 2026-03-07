export const MOBILE_ORIENTATION_OPTIONS = [
  {
    value: "BOTH",
    label: "Portrait + Landscape",
    summary: "Suitable for both",
  },
  {
    value: "PORTRAIT",
    label: "Portrait only",
    summary: "Lock to portrait",
  },
  {
    value: "LANDSCAPE",
    label: "Landscape only",
    summary: "Lock to landscape",
  },
] as const

export type MobileOrientation = (typeof MOBILE_ORIENTATION_OPTIONS)[number]["value"]

export function normalizeMobileOrientation(
  supportsMobile: boolean,
  orientation?: string | null
): MobileOrientation {
  if (!supportsMobile) {
    return "BOTH"
  }

  const normalized = orientation?.toUpperCase()

  if (normalized === "PORTRAIT" || normalized === "LANDSCAPE") {
    return normalized
  }

  return "BOTH"
}

export function getMobileOrientationLabel(orientation: MobileOrientation): string {
  switch (orientation) {
    case "PORTRAIT":
      return "PORTRAIT ONLY"
    case "LANDSCAPE":
      return "LANDSCAPE ONLY"
    default:
      return "PORTRAIT + LANDSCAPE"
  }
}

export function getMobileOrientationPrompt(orientation: Exclude<MobileOrientation, "BOTH">): string {
  return orientation === "LANDSCAPE" ? "Play in landscape" : "Play in portrait"
}
