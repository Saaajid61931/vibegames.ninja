import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { renderBuilderGameHtml } from "@/lib/builder/templates"
import type { BuilderTemplateKey } from "@/lib/builder/types"
import { logServerError } from "@/lib/server-log"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const revisionId = searchParams.get("revisionId")
    const published = searchParams.get("published") === "1"

    const project = await prisma.builderProject.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        templateKey: true,
        currentRevision: {
          select: {
            id: true,
            config: true,
          },
        },
        publishedRevision: {
          select: {
            id: true,
            config: true,
          },
        },
        publishedGame: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "PROJECT_NOT_FOUND" }, { status: 404 })
    }

    let revision = null

    if (published) {
      if (!project.publishedRevision || project.publishedGame?.status !== "PUBLISHED") {
        return NextResponse.json({ error: "PUBLISHED_PREVIEW_NOT_FOUND" }, { status: 404 })
      }
      revision = project.publishedRevision
    } else {
      const session = await auth()
      if (!session?.user?.id || session.user.id !== project.ownerId) {
        return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
      }

      if (revisionId) {
        revision = await prisma.builderRevision.findFirst({
          where: {
            id: revisionId,
            projectId: project.id,
          },
          select: {
            id: true,
            config: true,
          },
        })
      } else {
        revision = project.currentRevision
      }
    }

    if (!revision) {
      return NextResponse.json({ error: "REVISION_NOT_FOUND" }, { status: 404 })
    }

    return new NextResponse(renderBuilderGameHtml(project.templateKey as BuilderTemplateKey, revision.config), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": published ? "public, max-age=60" : "private, no-store",
      },
    })
  } catch (error) {
    logServerError("Builder preview failed", error, {
      route: "/api/builder/projects/[id]/preview",
      method: "GET",
    })
    return NextResponse.json({ error: "Failed to load builder preview" }, { status: 500 })
  }
}
