import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createBuilderDefaultConfig } from "@/lib/builder/templates"
import { builderProjectListSelect, serializeBuilderProjectListItem, builderProjectDetailInclude, serializeBuilderProject } from "@/lib/builder/data"
import { builderProjectCreateSchema } from "@/lib/builder/validations"
import { getBuilderPreviewPath, getRequestOrigin } from "@/lib/builder/urls"
import { logServerError } from "@/lib/server-log"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const projects = await prisma.builderProject.findMany({
      where: { ownerId: session.user.id },
      select: builderProjectListSelect,
      orderBy: { updatedAt: "desc" },
    })

    const origin = getRequestOrigin(request)
    return NextResponse.json({
      projects: projects.map((project) => serializeBuilderProjectListItem(project, origin)),
    })
  } catch (error) {
    logServerError("Builder projects list failed", error, {
      route: "/api/builder/projects",
      method: "GET",
    })
    return NextResponse.json({ error: "Failed to load builder projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = builderProjectCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid builder project" }, { status: 400 })
    }

    const config = createBuilderDefaultConfig(parsed.data.templateKey)
    const revisionId = crypto.randomUUID()

    const project = await prisma.$transaction(async (tx) => {
      const createdProject = await tx.builderProject.create({
        data: {
          ownerId: session.user.id,
          title: config.title,
          description: config.description,
          templateKey: config.templateKey,
          category: config.category,
          tags: config.tags.join(", "),
          supportsMobile: config.supportsMobile,
          mobileOrientation: config.mobileOrientation,
          status: "DRAFT",
        },
      })

      const revision = await tx.builderRevision.create({
        data: {
          id: revisionId,
          projectId: createdProject.id,
          prompt: "Created from starter template",
          summary: `Started a fresh ${config.templateKey} project.`,
          config: config as unknown as Prisma.InputJsonValue,
          snapshot: {
            difficulty: config.difficulty,
            theme: config.theme,
            supportsMobile: config.supportsMobile,
            mobileOrientation: config.mobileOrientation,
          } as Prisma.InputJsonValue,
          previewUrl: getBuilderPreviewPath(createdProject.id, { revisionId }),
          artifactUrl: getBuilderPreviewPath(createdProject.id, { revisionId }),
        },
      })

      await tx.builderMessage.createMany({
        data: [
          {
            projectId: createdProject.id,
            role: "SYSTEM",
            content: `Project booted from the ${config.templateKey} starter.`,
          },
          {
            projectId: createdProject.id,
            revisionId: revision.id,
            role: "ASSISTANT",
            content: "Starter loaded. Ask for theme changes, difficulty tuning, mobile tweaks, combo scoring, or a juicier feel.",
          },
        ],
      })

      await tx.builderProject.update({
        where: { id: createdProject.id },
        data: {
          currentRevisionId: revision.id,
        },
      })

      return tx.builderProject.findUniqueOrThrow({
        where: { id: createdProject.id },
        include: builderProjectDetailInclude,
      })
    })

    return NextResponse.json({
      project: serializeBuilderProject(project, getRequestOrigin(request)),
    })
  } catch (error) {
    logServerError("Create builder project failed", error, {
      route: "/api/builder/projects",
      method: "POST",
    })
    return NextResponse.json({ error: "Failed to create builder project" }, { status: 500 })
  }
}
