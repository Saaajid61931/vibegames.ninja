import type {
  GhostIntegrationReport,
  LevelEditorIntegrationReport,
} from "./storage-types"

export function createLevelEditorIntegrationReport(): LevelEditorIntegrationReport {
  return {
    notifyReady: false,
    onEnterEditMode: false,
    onLoadLevel: false,
    onRequestSave: false,
    saveLevel: false,
  }
}

export function collectLevelEditorSignals(sourceText: string, report: LevelEditorIntegrationReport) {
  if (!sourceText) {
    return
  }

  report.notifyReady = report.notifyReady || /\bVG\.notifyReady\s*\(/.test(sourceText)
  report.onEnterEditMode = report.onEnterEditMode || /\bVG\.onEnterEditMode\s*\(/.test(sourceText)
  report.onLoadLevel = report.onLoadLevel || /\bVG\.onLoadLevel\s*\(/.test(sourceText)
  report.onRequestSave = report.onRequestSave || /\bVG\.onRequestSave\s*\(/.test(sourceText)
  report.saveLevel = report.saveLevel || /\bVG\.saveLevel\s*\(/.test(sourceText)
}

export function createGhostIntegrationReport(): GhostIntegrationReport {
  return {
    notifyGhostReady: false,
    onLoadGhost: false,
    saveGhostRun: false,
  }
}

export function collectGhostSignals(sourceText: string, report: GhostIntegrationReport) {
  if (!sourceText) {
    return
  }

  report.notifyGhostReady = report.notifyGhostReady || /\bVG\.notifyGhostReady\s*\(/.test(sourceText)
  report.onLoadGhost = report.onLoadGhost || /\bVG\.onLoadGhost\s*\(/.test(sourceText)
  report.saveGhostRun = report.saveGhostRun || /\bVG\.saveGhostRun\s*\(/.test(sourceText)
}

export function isInspectableScript(path: string): boolean {
  return path.endsWith(".js") || path.endsWith(".mjs") || path.endsWith(".cjs") || path.endsWith(".ts")
}
