import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createBuilderDefaultConfig } from "@/lib/builder/templates"
import { createBuilderProjectFromPrompt } from "@/lib/builder/provider"
import { builderProjectListSelect, serializeBuilderProjectListItem, builderProjectDetailInclude, serializeBuilderProject } from "@/lib/builder/data"
import { builderProjectCreateSchema } from "@/lib/builder/validations"
import { getBuilderPreviewPath, getRequestOrigin } from "@/lib/builder/urls"
import { generateBuilderProjectFromScratchWithOpenRouter, OpenRouterBuilderError } from "@/lib/builder/openrouter"
import { DEFAULT_BUILDER_OPENROUTER_MODEL } from "@/lib/builder/types"
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

    const conceptPrompt = parsed.data.prompt?.trim() || ""
    const requestedTemplateKey = parsed.data.templateKey
    const openRouterApiKey = request.headers.get("x-openrouter-api-key")?.trim() || ""
    const resolvedOpenRouterModel =
      parsed.data.openRouterModel?.trim() || DEFAULT_BUILDER_OPENROUTER_MODEL

    let config = requestedTemplateKey ? createBuilderDefaultConfig(requestedTemplateKey) : null
    let templateKey = requestedTemplateKey || "endless-runner"
    let revisionPrompt = "Created from starter template"
    let revisionSummary = config ? `Started a fresh ${config.templateKey} project.` : "Created a fresh builder project."
    let assistantMessage =
      "Starter loaded. Ask for theme changes, difficulty tuning, mobile tweaks, combo scoring, or a juicier feel."
    let systemMessage = config
      ? `Project booted from the ${config.templateKey} starter.`
      : "Project booted from the builder."
    let snapshot: Prisma.InputJsonValue | typeof Prisma.JsonNull =
      config
        ? ({
            difficulty: config.difficulty,
            theme: config.theme,
            supportsMobile: config.supportsMobile,
            mobileOrientation: config.mobileOrientation,
          } as Prisma.InputJsonValue)
        : Prisma.JsonNull
    let note = requestedTemplateKey
      ? `Started from the ${requestedTemplateKey} starter template.`
      : "Created a new builder project."

    if (conceptPrompt) {
      let generated = null

      if (openRouterApiKey) {
        try {
          generated = await generateBuilderProjectFromScratchWithOpenRouter({
            prompt: conceptPrompt,
            templateKey: requestedTemplateKey,
            apiKey: openRouterApiKey,
            model: resolvedOpenRouterModel,
            origin: getRequestOrigin(request),
          })

          note = `Created the first draft with OpenRouter model ${resolvedOpenRouterModel}.`
        } catch (error) {
          if (error instanceof OpenRouterBuilderError && [401, 402, 403, 404, 408, 413, 422, 429].includes(error.status)) {
            return NextResponse.json({ error: error.message }, { status: error.status })
          }

          generated = createBuilderProjectFromPrompt({
            prompt: conceptPrompt,
            templateKey: requestedTemplateKey,
          })
          note =
            error instanceof OpenRouterBuilderError
              ? `${error.message} The first draft was created with the local generator instead.`
              : "OpenRouter was unavailable, so the local generator created the first draft instead."

          logServerError("OpenRouter first-draft creation failed, falling back to local generator", error, {
            route: "/api/builder/projects",
            method: "POST",
            provider: "openrouter",
          })
        }
      } else {
        generated = createBuilderProjectFromPrompt({
          prompt: conceptPrompt,
          templateKey: requestedTemplateKey,
        })

        note = requestedTemplateKey
          ? `Created the first draft from your prompt using the ${requestedTemplateKey} starter.`
          : "Created the first draft from scratch using the local generator."
      }

      if (!generated.ok || !generated.nextConfig) {
        return NextResponse.json(
          {
            error:
              generated.rejectedReason ||
              generated.response ||
              "That concept does not fit the current game generator.",
          },
          { status: 400 },
        )
      }

      templateKey = generated.templateKey
      config = generated.nextConfig
      revisionPrompt = conceptPrompt
      revisionSummary = generated.summary
      assistantMessage = generated.response
      systemMessage = requestedTemplateKey
        ? `Project booted from the ${templateKey} starter using your concept prompt.`
        : `Project booted from the ${templateKey} starter chosen from your concept prompt.`
      snapshot = ((generated.snapshot || {
        difficulty: config.difficulty,
        theme: config.theme,
        supportsMobile: config.supportsMobile,
        mobileOrientation: config.mobileOrientation,
        selectedTemplate: templateKey,
      }) as Prisma.InputJsonValue)
    }

    if (!config) {
      return NextResponse.json({ error: "Failed to create builder config" }, { status: 500 })
    }

    const revisionId = crypto.randomUUID()

    const project = await prisma.$transaction(async (tx) => {
      const createdProject = await tx.builderProject.create({
        data: {
          ownerId: session.user.id,
          title: config.title,
          description: config.description,
          templateKey,
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
          prompt: revisionPrompt,
          summary: revisionSummary,
          config: config as unknown as Prisma.InputJsonValue,
          snapshot,
          previewUrl: getBuilderPreviewPath(createdProject.id, { revisionId }),
          artifactUrl: getBuilderPreviewPath(createdProject.id, { revisionId }),
        },
      })

      await tx.builderMessage.createMany({
        data: [
          {
            projectId: createdProject.id,
            role: "SYSTEM",
            content: systemMessage,
          },
          {
            projectId: createdProject.id,
            revisionId: revision.id,
            role: "ASSISTANT",
            content: assistantMessage,
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
      note,
    })
  } catch (error) {
    logServerError("Create builder project failed", error, {
      route: "/api/builder/projects",
      method: "POST",
    })
    return NextResponse.json({ error: "Failed to create builder project" }, { status: 500 })
  }
}
