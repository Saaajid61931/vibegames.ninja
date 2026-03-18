import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { builderProjectDetailInclude, serializeBuilderProject } from "@/lib/builder/data"
import { applyBuilderPrompt } from "@/lib/builder/provider"
import type { BuilderTemplateKey } from "@/lib/builder/types"
import { builderMessageSchema } from "@/lib/builder/validations"
import { getBuilderPreviewPath, getRequestOrigin } from "@/lib/builder/urls"
import { logServerError } from "@/lib/server-log"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => null)
    const parsed = builderMessageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid builder prompt" }, { status: 400 })
    }

    const project = await prisma.builderProject.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
      include: {
        currentRevision: true,
      },
    })

    if (!project || !project.currentRevision) {
      return NextResponse.json({ error: "PROJECT_NOT_FOUND" }, { status: 404 })
    }

    const result = applyBuilderPrompt({
      templateKey: project.templateKey as BuilderTemplateKey,
      currentConfig: project.currentRevision.config,
      prompt: parsed.data.prompt,
      actionKey: parsed.data.actionKey,
    })

    const nextProject = await prisma.$transaction(async (tx) => {
      await tx.builderMessage.create({
        data: {
          projectId: project.id,
          revisionId: project.currentRevisionId || null,
          role: "USER",
          content: parsed.data.prompt,
        },
      })

      if (!result.ok) {
        await tx.builderMessage.create({
          data: {
            projectId: project.id,
            role: "ASSISTANT",
            content: result.response,
          },
        })

        return tx.builderProject.findUniqueOrThrow({
          where: { id: project.id },
          include: builderProjectDetailInclude,
        })
      }

      if (!result.nextConfig) {
        throw new Error("Builder provider did not return a next config.")
      }

      const revisionId = crypto.randomUUID()

      const revision = await tx.builderRevision.create({
        data: {
          id: revisionId,
          projectId: project.id,
          prompt: parsed.data.prompt,
          actionKey: parsed.data.actionKey,
          summary: result.summary,
          config: result.nextConfig as unknown as Prisma.InputJsonValue,
          snapshot: (result.snapshot || Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull,
          previewUrl: getBuilderPreviewPath(project.id, { revisionId }),
          artifactUrl: getBuilderPreviewPath(project.id, { revisionId }),
        },
      })

      await tx.builderMessage.create({
        data: {
          projectId: project.id,
          revisionId: revision.id,
          role: "ASSISTANT",
          content: result.response,
        },
      })

      await tx.builderProject.update({
        where: { id: project.id },
        data: {
          currentRevisionId: revision.id,
          title: result.nextConfig.title,
          description: result.nextConfig.description,
          category: result.nextConfig.category,
          tags: result.nextConfig.tags.join(", "),
          supportsMobile: result.nextConfig.supportsMobile,
          mobileOrientation: result.nextConfig.mobileOrientation,
        },
      })

      return tx.builderProject.findUniqueOrThrow({
        where: { id: project.id },
        include: builderProjectDetailInclude,
      })
    })

    return NextResponse.json({
      applied: result.ok,
      project: serializeBuilderProject(nextProject, getRequestOrigin(request)),
    })
  } catch (error) {
    logServerError("Apply builder prompt failed", error, {
      route: "/api/builder/projects/[id]/messages",
      method: "POST",
    })
    return NextResponse.json({ error: "Failed to apply builder prompt" }, { status: 500 })
  }
}
