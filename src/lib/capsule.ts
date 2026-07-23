import prisma from "@/lib/prisma"
import type { RemixPermission } from "@prisma/client"

export interface GameDnaInput {
  coreMechanic: string
  inputModel: {
    keyboard?: boolean
    touch?: boolean
    gamepad?: boolean
    keys?: string[]
  }
  winCondition?: string
  lossCondition?: string
  difficultyCurve?: string
  safeRemixBoundaries?: {
    allowPhysicsTuning?: boolean
    allowAssetReplacement?: boolean
    preserveWinLogic?: boolean
  }
}

export interface CapsuleManifestInput {
  title: string
  description?: string
  controls?: string[]
  supportsMobile?: boolean
  mobileOrientation?: "BOTH" | "PORTRAIT" | "LANDSCAPE"
  category?: string
  tags?: string[]
  aiTool?: string | null
  aiModel?: string | null
}

export async function createGameCapsule({
  gameId,
  slug,
  version = "1.0.0",
  buildArtifact,
  entryPoint = "index.html",
  remixPermission = "ATTRIBUTION_REQUIRED",
  manifest,
  gameDna,
  aiPromptUsed,
  aiModelUsed,
  aiToolUsed,
  parentCapsuleId,
}: {
  gameId: string
  slug: string
  version?: string
  buildArtifact: string
  entryPoint?: string
  remixPermission?: RemixPermission
  manifest: CapsuleManifestInput
  gameDna?: GameDnaInput
  aiPromptUsed?: string
  aiModelUsed?: string
  aiToolUsed?: string
  parentCapsuleId?: string
}) {
  const capsule = await prisma.gameCapsule.create({
    data: {
      gameId,
      slug: `${slug}-${version.replace(/\./g, "-")}`,
      version,
      buildArtifact,
      entryPoint,
      remixPermission,
      manifest: JSON.parse(JSON.stringify(manifest)),
      gameDna: gameDna ? JSON.parse(JSON.stringify(gameDna)) : null,
      aiPromptUsed: aiPromptUsed || null,
      aiModelUsed: aiModelUsed || null,
      aiToolUsed: aiToolUsed || null,
      parentCapsuleId: parentCapsuleId || null,
    },
  })

  return capsule
}

export async function getLatestCapsuleForGame(gameId: string) {
  return prisma.gameCapsule.findFirst({
    where: { gameId },
    orderBy: { createdAt: "desc" },
    include: {
      playtestReport: true,
      parentCapsule: {
        select: {
          id: true,
          slug: true,
          version: true,
          game: {
            select: { title: true, slug: true, creator: { select: { username: true, name: true } } }
          }
        }
      }
    }
  })
}
