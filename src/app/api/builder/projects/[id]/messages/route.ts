import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { builderProjectDetailInclude, serializeBuilderProject } from "@/lib/builder/data"
import { normalizeBuilderAiSettings } from "@/lib/builder/ai-providers"
import { applyBuilderPrompt } from "@/lib/builder/provider"
import { BuilderAiProviderError, generateBuilderResultWithAiProvider } from "@/lib/builder/ai-client"
import type {
  BuilderApplyPromptResponse,
  BuilderApplyProviderMeta,
  BuilderProviderResult,
  BuilderTemplateKey,
} from "@/lib/builder/types"
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

    const aiSettings = normalizeBuilderAiSettings(parsed.data.aiSettings)
    let result: BuilderProviderResult | undefined
    let provider: BuilderApplyProviderMeta = {
      type: "local",
      label: "Local Builder",
      model: null,
      fallbackFrom: null,
      message: null,
    }

    if (aiSettings.providerId !== "local") {
      try {
        const externalResult = await generateBuilderResultWithAiProvider({
          templateKey: project.templateKey as BuilderTemplateKey,
          currentConfig: project.currentRevision.config,
          prompt: parsed.data.prompt,
          actionKey: parsed.data.actionKey,
          settings: aiSettings,
          origin: getRequestOrigin(request),
        })
        result = externalResult
        provider = {
          type: externalResult.providerId,
          label: externalResult.label,
          model: externalResult.model,
          fallbackFrom: null,
          message: null,
        }
      } catch (error) {
        if (error instanceof BuilderAiProviderError && [400, 401, 402, 403, 404, 408, 413, 422, 429].includes(error.status)) {
          return NextResponse.json({ error: error.message }, { status: error.status })
        }

        provider = {
          type: "local",
          label: "Local Builder",
          model: aiSettings.model || null,
          fallbackFrom: aiSettings.providerId,
          message:
            error instanceof BuilderAiProviderError
              ? error.message
              : "The external AI provider was unavailable, so the local builder took over.",
        }

        logServerError("External builder provider failed, falling back to local builder", error, {
          route: "/api/builder/projects/[id]/messages",
          method: "POST",
          provider: aiSettings.providerId,
        })
      }
    }

    result ??= applyBuilderPrompt({
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

    return NextResponse.json<BuilderApplyPromptResponse>({
      applied: result.ok,
      project: serializeBuilderProject(nextProject, getRequestOrigin(request)),
      provider,
    })
  } catch (error) {
    logServerError("Apply builder prompt failed", error, {
      route: "/api/builder/projects/[id]/messages",
      method: "POST",
    })
    return NextResponse.json({ error: "Failed to apply builder prompt" }, { status: 500 })
  }
}
