import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { CommunityShell } from "@/components/community/community-shell"
import { SourceReviewAction } from "@/components/community/source-review-action"
import { RefundReview } from "@/components/community/refund-review"
export const dynamic = "force-dynamic"
export default async function SourceReview() {
  const user = (await auth())?.user
  if (user?.role !== "ADMIN") notFound()
  const packages = await prisma.sourcePackage.findMany({
    where: { status: "PENDING" },
    include: {
      game: {
        select: { title: true, slug: true, creator: { select: { name: true, username: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  })
  const active = await prisma.sourcePackage.findMany({
    where: { status: { in: ["APPROVED", "BLOCKED", "WITHDRAWN"] } },
    include: { game: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  const requests = await prisma.sourceOrder.findMany({
    where: { refundRequestedAt: { not: null }, status: "PAID" },
    include: { package: { include: { game: { select: { title: true } } } } },
    orderBy: { refundRequestedAt: "asc" },
    take: 50,
  })
  return (
    <CommunityShell
      title="Review source projects"
      description="Approval makes this exact project version available. Inspect the download, follow its setup instructions, and verify reuse permissions before approving."
    >
      {packages.map((p) => (
        <article key={p.id} className="inspiration-tile mb-6">
          <h2 className="heading-pixel-sm text-white">
            {p.game.title} · {p.version}
          </h2>
          <p className="mt-2 text-sm">
            {p.game.creator.name || p.game.creator.username} · {p.format} · {"$"}
            {(p.priceCents / 100).toFixed(2)}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm">{p.description}</p>
          <details className="mt-4">
            <summary className="cursor-pointer">Setup and license</summary>
            <p className="mt-3 whitespace-pre-wrap text-sm">{p.readme}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm">{p.license}</p>
            <p className="mt-3 text-sm">Requirements: {p.requirements || "None declared"}</p>
            <p className="mt-3 text-sm">Exclusions: {p.exclusions || "None declared"}</p>
          </details>
          <a href={"/api/source/" + p.id + "/download"} className="community-button mt-4">
            Download for review
          </a>
          <SourceReviewAction id={p.id} />
        </article>
      ))}
      {packages.length === 0 && (
        <p className="text-text-secondary">No source projects are waiting for review.</p>
      )}
      <section className="mt-10">
        <h2 className="mb-4 heading-pixel-md text-white">Manage existing source projects</h2>
        {active.map((p) => (
          <details key={p.id} className="inspiration-tile mb-3">
            <summary className="cursor-pointer">
              {p.game.title} · {p.version} · {p.status.toLowerCase()}
            </summary>
            <p className="my-3 whitespace-pre-wrap text-sm">{p.reviewNote}</p>
            <a href={"/api/source/" + p.id + "/download"} className="community-button">
              Inspect project
            </a>
            <SourceReviewAction id={p.id} currentStatus={p.status} />
          </details>
        ))}
      </section>
      <section className="mt-10">
        <h2 className="mb-4 heading-pixel-md text-white">Purchase support</h2>
        {requests.map((o) => (
          <article key={o.id} className="inspiration-tile mb-4">
            <h3 className="font-semibold">
              {o.package.game.title} · ${(o.amountCents / 100).toFixed(2)}
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm">{o.refundReason}</p>
            {o.supportReply && <p className="mt-3 text-sm">Last reply: {o.supportReply}</p>}
            <RefundReview id={o.id} />
          </article>
        ))}
        {requests.length === 0 && (
          <p className="text-sm text-text-secondary">No open purchase requests.</p>
        )}
      </section>
    </CommunityShell>
  )
}
