"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { SourceAcquireButton } from "@/components/community/source-acquire-button"
type Project = {
  id: string
  version: string
  description: string
  readme: string
  license: string
  format: string
  requirements: string
  exclusions: string
  priceCents: number
  currency: string
  manifest: { path: string; bytes: number }[]
}
type Community = {
  owner: boolean
  paymentsReady: boolean
  story: {
    builtFromPackage: { version: string; game: { slug: string; title: string } } | null
    idea: string
    lessons: string
    nextIdea: string
    inspiredBy: { slug: string; title: string } | null
  } | null
  packages: Project[]
}
export function GameCommunityPanel({ gameId }: { gameId: string }) {
  const [data, setData] = useState<Community | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0)
  useEffect(() => {
    const c = new AbortController()
    fetch("/api/games/" + gameId + "/community", { signal: c.signal })
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        setData(d)
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message)
      })
    return () => c.abort()
  }, [gameId, retry])
  if (error)
    return (
      <section id="source-project" className="inspiration-tile">
        <p className="text-sm text-text-secondary">
          Creator notes and source details could not be loaded.
        </p>
        <button
          className="community-button mt-3"
          onClick={() => {
            setError("")
            setRetry((n) => n + 1)
          }}
        >
          Try again
        </button>
      </section>
    )
  if (!data)
    return (
      <section id="source-project" className="inspiration-tile" aria-busy="true">
        <p className="text-sm text-text-secondary">Loading creator notes…</p>
      </section>
    )
  return (
    <div className="space-y-5">
      {data.story &&
        (data.story.idea ||
          data.story.lessons ||
          data.story.nextIdea ||
          data.story.inspiredBy ||
          data.story.builtFromPackage) && (
          <section className="inspiration-tile">
            <p className="text-sm text-primary-text">Behind the game</p>
            {[
              ["The idea", data.story.idea],
              ["What I learned", data.story.lessons],
              ["What I would try next", data.story.nextIdea],
            ].map(([label, text]) =>
              text ? (
                <div key={label} className="mt-5">
                  <h2 className="font-semibold text-white">{label}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-text-secondary">
                    {text}
                  </p>
                </div>
              ) : null,
            )}
            {data.story.builtFromPackage && (
              <p className="mt-5 text-sm">
                Built from{" "}
                <Link
                  className="text-primary-text"
                  href={"/play/" + data.story.builtFromPackage.game.slug}
                >
                  {data.story.builtFromPackage.game.title} · {data.story.builtFromPackage.version}
                </Link>
              </p>
            )}
            {data.story.inspiredBy && (
              <p className="mt-5 text-sm">
                Inspired by{" "}
                <Link className="text-primary-text" href={"/play/" + data.story.inspiredBy.slug}>
                  {data.story.inspiredBy.title}
                </Link>
              </p>
            )}
          </section>
        )}
      <section id="source-project" className="inspiration-tile scroll-mt-24">
        <h2 className="text-xl font-semibold">Build on an idea you love</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Playing and getting inspired are free. Source projects are an optional head start, shared
          by their creators.
        </p>
        {data.packages.length === 0 ? (
          <p className="mt-4 text-sm text-text-secondary">
            The creator has not shared a source project for this game.
          </p>
        ) : (
          data.packages.map((p) => (
            <article key={p.id} className="mt-6 border-t border-border pt-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">
                    {p.format} · Version {p.version}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
                    {p.description}
                  </p>
                </div>
                <SourceAcquireButton
                  id={p.id}
                  priceCents={p.priceCents}
                  available={data.paymentsReady}
                />
              </div>
              {p.requirements && (
                <p className="mt-4 whitespace-pre-wrap text-sm">
                  <strong>Requirements:</strong> {p.requirements}
                </p>
              )}
              {p.exclusions && (
                <p className="mt-3 whitespace-pre-wrap text-sm">
                  <strong>Not included:</strong> {p.exclusions}
                </p>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer py-2 text-sm text-primary-text">
                  Setup instructions and included files
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{p.readme}</p>
                <ul className="mt-4 max-h-48 overflow-auto text-xs text-text-secondary">
                  {p.manifest.map((f) => (
                    <li key={f.path} className="py-1 break-all">
                      {f.path}
                    </li>
                  ))}
                </ul>
              </details>
              <details className="mt-2">
                <summary className="cursor-pointer py-2 text-sm text-primary-text">
                  Read reuse permissions before downloading
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{p.license}</p>
              </details>
            </article>
          ))
        )}
        {data.owner && (
          <Link className="community-button mt-5" href={"/creator/projects?game=" + gameId}>
            Add your story or source project
          </Link>
        )}
      </section>
    </div>
  )
}
