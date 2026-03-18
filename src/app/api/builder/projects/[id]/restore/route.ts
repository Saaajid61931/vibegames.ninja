import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { builderProjectDetailInclude, serializeBuilderProject } from "@/lib/builder/data"
import { coerceBuilderConfig } from "@/lib/builder/templates"
import type { BuilderTemplateKey } from "@/lib/builder/types"
import { builderRestoreSchema } from "@/lib/builder/validations"
import { getRequestOrigin } from "@/lib/builder/urls"
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
    const parsed = builderRestoreSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid revision" }, { status: 400 })
    }

    const project = await prisma.builderProject.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        supportsMobile: true,
        mobileOrientation: true,
        templateKey: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "PROJECT_NOT_FOUND" }, { status: 404 })
    }

    const revision = await prisma.builderRevision.findFirst({
      where: {
        id: parsed.data.revisionId,
        projectId: project.id,
      },
      select: {
        id: true,
        config: true,
        summary: true,
      },
    })

    if (!revision) {
      return NextResponse.json({ error: "REVISION_NOT_FOUND" }, { status: 404 })
    }

    const nextConfig = coerceBuilderConfig(project.templateKey as BuilderTemplateKey, revision.config)

    const nextProject = await prisma.$transaction(async (tx) => {
      await tx.builderProject.update({
        where: { id: project.id },
        data: {
          currentRevisionId: revision.id,
          title: nextConfig.title,
          description: nextConfig.description,
          category: nextConfig.category,
          tags: nextConfig.tags.join(", "),
          supportsMobile: nextConfig.supportsMobile,
          mobileOrientation: nextConfig.mobileOrientation,
        },
      })

      await tx.builderMessage.create({
        data: {
          projectId: project.id,
          revisionId: revision.id,
          role: "SYSTEM",
          content: `Restored revision: ${revision.summary}`,
        },
      })

      return tx.builderProject.findUniqueOrThrow({
        where: { id: project.id },
        include: builderProjectDetailInclude,
      })
    })

    return NextResponse.json({
      project: serializeBuilderProject(nextProject, getRequestOrigin(request)),
    })
  } catch (error) {
    logServerError("Restore builder revision failed", error, {
      route: "/api/builder/projects/[id]/restore",
      method: "POST",
    })
    return NextResponse.json({ error: "Failed to restore revision" }, { status: 500 })
  }
}
