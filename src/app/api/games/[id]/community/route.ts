import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { CommunityError, communityError, requireCommunityUser } from "@/lib/community-api"
import { storySchema } from "@/lib/source-projects"
import { paymentsReady } from "@/lib/source-payments"
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = (await auth())?.user
    const game = await prisma.game.findUnique({
      where: { id },
      select: {
        creatorId: true,
        status: true,
        story: {
          include: {
            builtFromPackage: {
              select: {
                id: true,
                version: true,
                game: { select: { slug: true, title: true, status: true } },
              },
            },
            inspiredBy: { select: { slug: true, title: true, status: true } },
          },
        },
        sourcePackages: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true,
            version: true,
            description: true,
            readme: true,
            license: true,
            format: true,
            requirements: true,
            exclusions: true,
            priceCents: true,
            currency: true,
            manifest: true,
            reviewedAt: true,
          },
        },
      },
    })
    if (!game || (game.status !== "PUBLISHED" && game.creatorId !== user?.id))
      throw new CommunityError("Game unavailable.", 404)
    const story = game.story
      ? {
          ...game.story,
          builtFromPackage:
            game.story.builtFromPackage?.game.status === "PUBLISHED"
              ? game.story.builtFromPackage
              : null,
          inspiredBy: game.story.inspiredBy?.status === "PUBLISHED" ? game.story.inspiredBy : null,
        }
      : null
    return NextResponse.json(
      {
        story,
        packages: game.sourcePackages,
        owner: game.creatorId === user?.id,
        paymentsReady: paymentsReady(),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (e) {
    return communityError(e)
  }
}
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCommunityUser(request)
    const { id } = await params
    const game = await prisma.game.findFirst({
      where: { id, creatorId: user.id },
      select: { id: true },
    })
    if (!game) throw new CommunityError("Game not found.", 404)
    const { inspiredBySlug, builtFromPackageId, ...story } = storySchema.parse(await request.json())
    const parent = inspiredBySlug
      ? await prisma.game.findFirst({
          where: { slug: inspiredBySlug, status: "PUBLISHED" },
          select: { id: true },
        })
      : null
    if (inspiredBySlug && (!parent || parent.id === id))
      throw new CommunityError(
        "Choose a published game other than this one for inspiration credit.",
      )
    const source = builtFromPackageId
      ? await prisma.sourcePackage.findFirst({
          where: {
            id: builtFromPackageId,
            game: { status: "PUBLISHED" },
            OR: [
              { game: { creatorId: user.id } },
              { orders: { some: { buyerId: user.id, status: "PAID" } } },
            ],
          },
          select: { id: true, gameId: true },
        })
      : null
    if (builtFromPackageId && (!source || source.gameId === id))
      throw new CommunityError("Choose an acquired source project from another game.")
    const provenance = { builtFromPackageId: source?.id || null }
    await prisma.gameStory.upsert({
      where: { gameId: id },
      create: { gameId: id, ...story, ...provenance, inspiredById: parent?.id || null },
      update: { ...story, ...provenance, inspiredById: parent?.id || null },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return communityError(e)
  }
}
