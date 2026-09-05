import { createHash } from "node:crypto"
import prisma from "@/lib/prisma"
import { CommunityError, communityError, requireCommunityUser } from "@/lib/community-api"
import { readSourceArchive } from "@/lib/source-storage"
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCommunityUser()
    const { id } = await params
    const source = await prisma.sourcePackage.findUnique({
      where: { id },
      include: { game: { select: { creatorId: true, slug: true, status: true } } },
    })
    if (!source) throw new CommunityError("Project unavailable.", 404)
    const owner = source.game.creatorId === user.id
    const reviewer = user.role === "ADMIN"
    if (!owner && !reviewer) {
      if (source.status === "BLOCKED")
        throw new CommunityError(
          "This project was removed for a safety or rights review. Please contact support.",
          403,
        )
      if (
        !(await prisma.sourceOrder.findFirst({
          where: { buyerId: user.id, packageId: id, status: "PAID" },
        }))
      )
        throw new CommunityError("Get this source project before downloading it.", 403)
    }
    const bytes = await readSourceArchive(source.storageKey)
    if (createHash("sha256").update(bytes).digest("hex") !== source.sha256)
      throw new CommunityError(
        "The project file could not be verified. Please contact support.",
        503,
      )
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="' +
          source.game.slug.replace(/[^a-z0-9-]/gi, "") +
          "-" +
          source.version +
          '.zip"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
      },
    })
  } catch (e) {
    return communityError(e)
  }
}
