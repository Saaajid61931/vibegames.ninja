export type LevelEditorIntegrationReport = {
  notifyReady: boolean
  onEnterEditMode: boolean
  onLoadLevel: boolean
  onRequestSave: boolean
  saveLevel: boolean
}

export type GhostIntegrationReport = {
  notifyGhostReady: boolean
  onLoadGhost: boolean
  saveGhostRun: boolean
}

export type UploadGameToR2Options = {
  injectPlatformSdk?: boolean
  inspectLevelEditorIntegration?: boolean
  inspectGhostIntegration?: boolean
}

export type ThumbnailSlideUpload = {
  original: string
  variants?: Array<{
    width: number
    image: string
  }>
}

export const RESPONSIVE_THUMBNAIL_WIDTHS = new Set([320, 640])
export const RESPONSIVE_THUMBNAIL_QUERY = "rv=1"
