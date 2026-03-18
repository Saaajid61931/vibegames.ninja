import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { builderProjectDetailInclude, serializeBuilderProject } from "@/lib/builder/data"
import { getRequestOrigin } from "@/lib/builder/urls"
import { logServerError } from "@/lib/server-log"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const { id } = await params
    const project = await prisma.builderProject.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
      include: builderProjectDetailInclude,
    })

    if (!project) {
      return NextResponse.json({ error: "PROJECT_NOT_FOUND" }, { status: 404 })
    }

    return NextResponse.json({
      project: serializeBuilderProject(project, getRequestOrigin(request)),
    })
  } catch (error) {
    logServerError("Load builder project failed", error, {
      route: "/api/builder/projects/[id]",
      method: "GET",
    })
    return NextResponse.json({ error: "Failed to load builder project" }, { status: 500 })
  }
}
