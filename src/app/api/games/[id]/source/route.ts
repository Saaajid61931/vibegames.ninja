import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { CommunityError, communityError, requireCommunityUser } from "@/lib/community-api"
import { sourceMetadataSchema } from "@/lib/source-projects"
import { storeSourceArchive, removeSourceArchive, sourceStorageReady } from "@/lib/source-storage"
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCommunityUser(request)
    const { id } = await params
    if (!sourceStorageReady())
      throw new CommunityError(
        "Source uploads are not available yet. Your playable game and creator story can still be shared.",
        503,
      )
    if (!(await prisma.game.findFirst({ where: { id, creatorId: user.id, status: "PUBLISHED" } })))
      throw new CommunityError("Publish your own game before adding a source project.", 404)
    if (Number(request.headers.get("content-length") || 0) > 22 * 1024 * 1024)
      throw new CommunityError("Please keep the upload below 20 MB.", 413)
    if ((await prisma.sourcePackage.count({ where: { gameId: id, status: "PENDING" } })) >= 3)
      throw new CommunityError("Please wait for your pending versions to be reviewed.")
    const form = await request.formData()
    const { rightsConfirmed, ...metadata } = sourceMetadataSchema.parse(
      JSON.parse(String(form.get("metadata") || "{}")),
    )
    if (!rightsConfirmed) throw new CommunityError("Confirm your rights to share this project.")
    const file = form.get("file")
    if (
      !(file instanceof File) ||
      !file.name.toLowerCase().endsWith(".zip") ||
      file.size > 20 * 1024 * 1024
    )
      throw new CommunityError("Upload a ZIP below 20 MB.")
    if (
      await prisma.sourcePackage.findUnique({
        where: { gameId_version: { gameId: id, version: metadata.version } },
      })
    )
      throw new CommunityError("That version already exists. Use a new version number.")
    const archive = await storeSourceArchive(Buffer.from(await file.arrayBuffer()))
    try {
      const source = await prisma.sourcePackage.create({
        data: { gameId: id, ...metadata, ...archive },
      })
      return NextResponse.json({ id: source.id, status: source.status }, { status: 201 })
    } catch (e) {
      await removeSourceArchive(archive.storageKey).catch(() => {})
      throw e
    }
  } catch (e) {
    return communityError(e)
  }
}
