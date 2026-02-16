import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * DELETE /api/featured/[id]
 * Admin-only: removes a scheduled featured game pick.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.featuredGame.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Featured pick not found" }, { status: 404 })
    }

    await prisma.featuredGame.delete({ where: { id } })

    revalidateTag("featured", "max")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete featured pick:", error)
    return NextResponse.json({ error: "Failed to delete featured pick" }, { status: 500 })
  }
}
