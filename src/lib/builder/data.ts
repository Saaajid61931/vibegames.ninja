import { Prisma } from "@prisma/client"
import { createBuilderPlaceholderThumbnail } from "@/lib/builder/templates"
import type { BuilderTemplateKey } from "@/lib/builder/types"
import { getBuilderPreviewPath, toAbsoluteUrl } from "@/lib/builder/urls"

export const builderProjectDetailInclude = Prisma.validator<Prisma.BuilderProjectInclude>()({
  currentRevision: true,
  publishedRevision: true,
  revisions: {
    orderBy: { createdAt: "desc" },
    take: 20,
  },
  messages: {
    orderBy: { createdAt: "asc" },
    take: 40,
  },
  publishedGame: {
    select: {
      id: true,
      slug: true,
      title: true,
      thumbnail: true,
      status: true,
      createdAt: true,
      plays: true,
      likes: true,
    },
  },
})

export const builderProjectListSelect = Prisma.validator<Prisma.BuilderProjectSelect>()({
  id: true,
  title: true,
  description: true,
  templateKey: true,
  status: true,
  category: true,
  tags: true,
  supportsMobile: true,
  mobileOrientation: true,
  thumbnail: true,
  createdAt: true,
  updatedAt: true,
  currentRevision: {
    select: {
      id: true,
      prompt: true,
      actionKey: true,
      summary: true,
      config: true,
      snapshot: true,
      createdAt: true,
    },
  },
  publishedRevision: {
    select: {
      id: true,
      summary: true,
      createdAt: true,
    },
  },
  publishedGame: {
    select: {
      id: true,
      slug: true,
      title: true,
      thumbnail: true,
      status: true,
      createdAt: true,
      plays: true,
      likes: true,
    },
  },
})

type BuilderProjectWithRelations = Prisma.BuilderProjectGetPayload<{
  include: typeof builderProjectDetailInclude
}>

type BuilderProjectListItem = Prisma.BuilderProjectGetPayload<{
  select: typeof builderProjectListSelect
}>

function serializeRevision(
  projectId: string,
  revision: { id: string; prompt: string; actionKey: string | null; summary: string; config: Prisma.JsonValue; snapshot: Prisma.JsonValue | null; createdAt: Date },
  origin?: string | null
) {
  const previewPath = getBuilderPreviewPath(projectId, { revisionId: revision.id })

  return {
    id: revision.id,
    prompt: revision.prompt,
    actionKey: revision.actionKey,
    summary: revision.summary,
    config: revision.config,
    snapshot: revision.snapshot,
    createdAt: revision.createdAt.toISOString(),
    previewUrl: toAbsoluteUrl(origin, previewPath),
    previewPath,
  }
}

export function serializeBuilderProject(project: BuilderProjectWithRelations, origin?: string | null) {
  const currentConfig = project.currentRevision?.config ?? null
  const thumbnail =
    project.thumbnail ||
    createBuilderPlaceholderThumbnail(project.templateKey as BuilderTemplateKey, currentConfig || {
      title: project.title,
      description: project.description || "",
      category: project.category,
      tags: project.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      supportsMobile: project.supportsMobile,
      mobileOrientation: project.mobileOrientation,
    })

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    templateKey: project.templateKey,
    status: project.status,
    category: project.category,
    tags: project.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    supportsMobile: project.supportsMobile,
    mobileOrientation: project.mobileOrientation,
    thumbnail,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    currentRevision: project.currentRevision
      ? serializeRevision(project.id, project.currentRevision, origin)
      : null,
    publishedRevision: project.publishedRevision
      ? {
          id: project.publishedRevision.id,
          summary: project.publishedRevision.summary,
          createdAt: project.publishedRevision.createdAt.toISOString(),
          previewUrl: toAbsoluteUrl(origin, getBuilderPreviewPath(project.id, { published: true })),
          previewPath: getBuilderPreviewPath(project.id, { published: true }),
        }
      : null,
    revisions: project.revisions.map((revision) => serializeRevision(project.id, revision, origin)),
    messages: project.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      revisionId: message.revisionId,
      createdAt: message.createdAt.toISOString(),
    })),
    publishedGame: project.publishedGame
      ? {
          ...project.publishedGame,
          createdAt: project.publishedGame.createdAt.toISOString(),
        }
      : null,
  }
}

export function serializeBuilderProjectListItem(project: BuilderProjectListItem, origin?: string | null) {
  const thumbnail =
    project.thumbnail ||
    createBuilderPlaceholderThumbnail(project.templateKey as BuilderTemplateKey, project.currentRevision?.config || {
      title: project.title,
      description: project.description || "",
      category: project.category,
      tags: project.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      supportsMobile: project.supportsMobile,
      mobileOrientation: project.mobileOrientation,
    })

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    templateKey: project.templateKey,
    status: project.status,
    category: project.category,
    tags: project.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    supportsMobile: project.supportsMobile,
    mobileOrientation: project.mobileOrientation,
    thumbnail,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    currentRevision: project.currentRevision
      ? {
          id: project.currentRevision.id,
          summary: project.currentRevision.summary,
          createdAt: project.currentRevision.createdAt.toISOString(),
          previewUrl: toAbsoluteUrl(origin, getBuilderPreviewPath(project.id, { revisionId: project.currentRevision.id })),
          previewPath: getBuilderPreviewPath(project.id, { revisionId: project.currentRevision.id }),
        }
      : null,
    publishedRevision: project.publishedRevision
      ? {
          id: project.publishedRevision.id,
          summary: project.publishedRevision.summary,
          createdAt: project.publishedRevision.createdAt.toISOString(),
        }
      : null,
    publishedGame: project.publishedGame
      ? {
          ...project.publishedGame,
          createdAt: project.publishedGame.createdAt.toISOString(),
        }
      : null,
  }
}
