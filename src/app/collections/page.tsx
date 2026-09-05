import Link from "next/link"
import { CommunityShell } from "@/components/community/community-shell"
import { InspirationCollections } from "@/components/community/inspiration-collections"
import { CollectionsManager } from "@/components/community/collections-manager"
import prisma, { isPrismaDatasourceConfigured } from "@/lib/prisma"
export const dynamic = "force-dynamic"
export const metadata = { title: "Collections — keep your next idea close" }
export default async function CollectionsPage() {
  const published = isPrismaDatasourceConfigured()
    ? await prisma.inspirationCollection
        .findMany({
          where: { isPublic: true, items: { some: { game: { status: "PUBLISHED" } } } },
          include: {
            user: { select: { username: true, name: true } },
            _count: { select: { items: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 12,
        })
        .catch(() => [])
    : []
  return (
    <CommunityShell
      title="A place for your next idea"
      description="Collect surprising mechanics, favorite worlds, and games you want to come back to."
    >
      <InspirationCollections />
      {published.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold">Collected by the community</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {published.map((c) => (
              <Link href={"/collections/" + c.id} key={c.id} className="inspiration-tile">
                <h3 className="font-semibold">{c.name}</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  by {c.user.name || c.user.username || "a creator"}
                </p>
                <p className="mt-2 text-sm">{c.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      <CollectionsManager />
    </CommunityShell>
  )
}
