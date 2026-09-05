import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { CommunityShell } from "@/components/community/community-shell"
import { SourceEditor } from "@/components/community/source-editor"
import { PayoutSetup } from "@/components/community/payout-setup"
import { sourceStorageReady } from "@/lib/source-storage"
import { paymentsReady } from "@/lib/source-payments"
import { WithdrawSource } from "@/components/community/withdraw-source"
export const dynamic = "force-dynamic"
export const metadata = { title: "Creator workspace — stories and source projects" }
export default async function CreatorProjects({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const user = (await auth())?.user
  if (!user?.id) redirect("/login?callbackUrl=%2Fcreator%2Fprojects")
  const query = await searchParams
  const games = await prisma.game.findMany({
    where: { creatorId: user.id },
    select: { id: true, title: true, slug: true, status: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  })
  const selected = games.find((g) => g.id === query.game) || games[0]
  const story = selected
    ? await prisma.gameStory.findUnique({
        where: { gameId: selected.id },
        include: { inspiredBy: { select: { slug: true } } },
      })
    : null
  const packages = selected
    ? await prisma.sourcePackage.findMany({
        where: { gameId: selected.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, version: true, status: true, reviewNote: true, priceCents: true },
      })
    : []
  const acquired = await prisma.sourcePackage.findMany({
    where: {
      game: { status: "PUBLISHED", id: { not: selected?.id } },
      orders: { some: { buyerId: user.id, status: "PAID" } },
    },
    select: { id: true, version: true, game: { select: { title: true } } },
    take: 100,
  })
  const sales = await prisma.sourceOrder.aggregate({
    where: { package: { game: { creatorId: user.id } }, status: "PAID" },
    _sum: { amountCents: true, platformFeeCents: true },
    _count: true,
  })
  return (
    <CommunityShell
      title="Tell the story. Share a starting point."
      description="Give your experiments a little context, and choose whether to share their source."
    >
      <PayoutSetup available={paymentsReady()} />
      <p className="mb-6 text-sm text-text-secondary">
        Projects acquired: {sales._count} · Creator transfers before refunds: {"$"}
        {(((sales._sum.amountCents || 0) - (sales._sum.platformFeeCents || 0)) / 100).toFixed(
          2,
        )}{" "}
        USD. Bank payout timing is managed by the payment provider.
      </p>
      {user.role === "ADMIN" && (
        <Link href="/source-review" className="community-button mb-5">
          Review source submissions
        </Link>
      )}
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Choose your game">
        {games.map((g) => (
          <Link
            key={g.id}
            href={"/creator/projects?game=" + g.id}
            className={"community-button " + (g.id === selected?.id ? "primary" : "")}
          >
            {g.title}
          </Link>
        ))}
      </nav>
      {selected ? (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <h2 className="heading-pixel-md text-white">{selected.title}</h2>
            <Link href={"/play/" + selected.slug} className="text-sm text-primary-text">
              View game →
            </Link>
          </div>
          <SourceEditor
            key={selected.id}
            gameId={selected.id}
            sourceChoices={acquired.map((p) => ({
              id: p.id,
              label: p.game.title + " · " + p.version,
            }))}
            uploadsReady={sourceStorageReady() && selected.status === "PUBLISHED"}
            initialStory={{
              builtFromPackageId: story?.builtFromPackageId || "",
              idea: story?.idea || "",
              lessons: story?.lessons || "",
              nextIdea: story?.nextIdea || "",
              inspiredBySlug: story?.inspiredBy?.slug || "",
            }}
          />
          {packages.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 heading-pixel-sm text-white">Your source versions</h2>
              {packages.map((p) => (
                <article key={p.id} className="inspiration-tile mb-3">
                  <p className="font-semibold">
                    Version {p.version} ·{" "}
                    {p.priceCents ? "$" + (p.priceCents / 100).toFixed(2) : "Free"} ·{" "}
                    {p.status.toLowerCase()}
                  </p>
                  {p.reviewNote && <p className="mt-3 text-sm">{p.reviewNote}</p>}
                  <a href={"/api/source/" + p.id + "/download"} className="community-button mt-3">
                    Download your uploaded ZIP
                  </a>
                  {["PENDING", "APPROVED"].includes(p.status) && <WithdrawSource id={p.id} />}
                </article>
              ))}
            </section>
          )}
        </>
      ) : (
        <div className="inspiration-tile">
          <p>Share your first playable game to add its story and an optional source project.</p>
          <Link href="/upload" className="community-button primary mt-4">
            Share your game
          </Link>
        </div>
      )}
    </CommunityShell>
  )
}
