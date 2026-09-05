import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { CommunityShell } from "@/components/community/community-shell"
import { RefundRequest } from "@/components/community/refund-request"
export const dynamic = "force-dynamic"
export const metadata = { title: "Your source projects" }
export default async function Library({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const user = (await auth())?.user
  if (!user?.id) redirect("/login?callbackUrl=%2Flibrary")
  const { checkout } = await searchParams
  const orders = await prisma.sourceOrder.findMany({
    where: { buyerId: user.id },
    include: { package: { include: { game: { select: { title: true, slug: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return (
    <CommunityShell
      title="Your next starting point"
      description="Find your source projects, setup instructions, and purchase records here."
    >
      {checkout && (
        <div role="status" className="inspiration-tile mb-6">
          Thanks for coming back. Downloads appear only after payment confirmation. If a purchase is
          still pending, refresh this page in a moment.{" "}
          <Link href="/library" className="text-primary-text underline">
            Refresh library
          </Link>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {orders.map((order) => (
          <article key={order.id} className="inspiration-tile">
            <Link className="text-xl font-semibold" href={"/play/" + order.package.game.slug}>
              {order.package.game.title}
            </Link>
            <p className="mt-2 text-sm text-text-secondary">
              Version {order.package.version} ·{" "}
              {order.amountCents
                ? "$" + (order.amountCents / 100).toFixed(2) + " USD"
                : "Free source"}{" "}
              · {order.status.toLowerCase()}
            </p>
            <p className="mt-2 break-all text-xs text-text-secondary">
              Receipt reference: {order.id} · {order.createdAt.toISOString().slice(0, 10)}
            </p>
            {order.status === "PAID" && order.package.status !== "BLOCKED" ? (
              <a
                href={"/api/source/" + order.packageId + "/download"}
                className="community-button primary mt-4"
              >
                Download project ZIP
              </a>
            ) : (
              <p className="mt-4 text-sm text-text-secondary">
                Download access is{" "}
                {order.package.status === "BLOCKED"
                  ? "paused for review"
                  : order.status.toLowerCase()}
                .
              </p>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-primary-text">
                Setup and reuse permissions
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{order.package.readme}</p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{order.package.license}</p>
            </details>
            {order.amountCents > 0 && (order.status === "PAID" || order.refundRequestedAt) && (
              <RefundRequest
                id={order.id}
                requested={Boolean(order.refundRequestedAt)}
                reply={order.supportReply}
              />
            )}
            <Link
              href={"/play/" + order.package.game.slug + "#comments"}
              className="mt-4 inline-block text-sm text-primary-text"
            >
              Ask the creator a question →
            </Link>
          </article>
        ))}
      </div>
      {orders.length === 0 && (
        <div className="inspiration-tile">
          <h2 className="text-xl font-semibold">
            Start with a game that catches your imagination.
          </h2>
          <p className="my-3 text-sm text-text-secondary">
            When you get a source project, its files and instructions will be kept here.
          </p>
          <Link href="/games" className="community-button">
            Find a game
          </Link>
        </div>
      )}
    </CommunityShell>
  )
}
