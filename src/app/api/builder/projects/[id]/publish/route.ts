import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { builderProjectDetailInclude, serializeBuilderProject } from "@/lib/builder/data"
import { builderPublishSchema } from "@/lib/builder/validations"
import { coerceBuilderConfig, createBuilderPlaceholderThumbnail } from "@/lib/builder/templates"
import type { BuilderTemplateKey } from "@/lib/builder/types"
import { getBuilderPreviewPath, getRequestOrigin, toAbsoluteUrl } from "@/lib/builder/urls"
import { logServerError } from "@/lib/server-log"
import { slugify } from "@/lib/utils"

async function getUniqueGameSlug(baseTitle: string) {
  const baseSlug = slugify(baseTitle) || "builder-game"
  let slug = baseSlug
  let suffix = 1

  while (await prisma.game.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }

  return slug
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = builderPublishSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid publish payload" }, { status: 400 })
    }

    const { id } = await params
    const origin = getRequestOrigin(request)

    const project = await prisma.builderProject.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
      include: {
        currentRevision: true,
        publishedGame: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    })

    if (!project || !project.currentRevision) {
      return NextResponse.json({ error: "PROJECT_NOT_FOUND" }, { status: 404 })
    }

    const currentRevision = project.currentRevision
    const config = coerceBuilderConfig(project.templateKey as BuilderTemplateKey, currentRevision.config)
    const thumbnail =
      parsed.data.thumbnail ||
      project.thumbnail ||
      createBuilderPlaceholderThumbnail(project.templateKey as BuilderTemplateKey, config)
    const gameUrl = toAbsoluteUrl(origin, getBuilderPreviewPath(project.id, { published: true }))
    const newSlug = project.publishedGame?.id ? null : await getUniqueGameSlug(config.title)

    const nextProject = await prisma.$transaction(async (tx) => {
      if (project.publishedGame?.id) {
        await tx.game.update({
          where: { id: project.publishedGame.id },
          data: {
            title: config.title,
            description: config.description,
            instructions: config.controlsHint,
            category: config.category,
            tags: config.tags.join(", "),
            supportsMobile: config.supportsMobile,
            mobileOrientation: config.mobileOrientation,
            thumbnail,
            thumbnailSlides: [thumbnail],
            aiTool: "other",
            aiModel: "other",
            isAIGenerated: true,
            buildSource: "BUILDER",
            gameUrl,
            latestUpdateNote: currentRevision.summary || "Updated in VibeGames Builder.",
          },
        })
      } else {
        await tx.game.create({
          data: {
            slug: newSlug || "builder-game",
            title: config.title,
            description: config.description,
            instructions: config.controlsHint,
            category: config.category,
            tags: config.tags.join(", "),
            aiTool: "other",
            aiModel: "other",
            supportsMobile: config.supportsMobile,
            mobileOrientation: config.mobileOrientation,
            hasLevelEditor: false,
            hasGhostSharing: false,
            seekingFeedback: false,
            isAIGenerated: true,
            thumbnail,
            thumbnailSlides: [thumbnail],
            creatorId: session.user.id,
            status: "PUBLISHED",
            publishedAt: new Date(),
            buildSource: "BUILDER",
            sourceProjectId: project.id,
            gameUrl,
          },
        })
      }

      await tx.builderProject.update({
        where: { id: project.id },
        data: {
          status: "PUBLISHED",
          publishedRevisionId: currentRevision.id,
          thumbnail,
        },
      })

      await tx.builderMessage.create({
        data: {
          projectId: project.id,
          revisionId: currentRevision.id,
          role: "SYSTEM",
          content: "Published the current revision to a live game page.",
        },
      })

      return tx.builderProject.findUniqueOrThrow({
        where: { id: project.id },
        include: builderProjectDetailInclude,
      })
    })

    revalidateTag("games", "max")

    return NextResponse.json({
      project: serializeBuilderProject(nextProject, origin),
    })
  } catch (error) {
    logServerError("Publish builder project failed", error, {
      route: "/api/builder/projects/[id]/publish",
      method: "POST",
    })
    return NextResponse.json({ error: "Failed to publish builder project" }, { status: 500 })
  }
}
