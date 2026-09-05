import Link from "next/link"
import { auth } from "@/lib/auth"
import { UploadPageClient } from "@/components/upload/upload-page-client"
import { CommunityShell } from "@/components/community/community-shell"
export default async function UploadPage() {
  const user = (await auth())?.user
  if (user) return <UploadPageClient />
  return (
    <CommunityShell
      title="Your experiment belongs here."
      description="Share a game made with your favorite AI tools. Help someone discover an idea they would never have found on their own."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          [
            "1",
            "Bring your game",
            "Upload a browser-ready HTML file or ZIP with an index.html entry point. You can also paste HTML.",
          ],
          [
            "2",
            "Give it a little context",
            "Preview it, choose a thumbnail, describe the idea and explain the controls.",
          ],
          [
            "3",
            "Share and connect",
            "Publish for people to play free. Add creator notes or an optional source project from your workspace.",
          ],
        ].map(([n, title, description]) => (
          <article key={n} className="inspiration-tile">
            <p className="text-primary-text">{n}</p>
            <h2 className="mt-4 text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary">{description}</p>
          </article>
        ))}
      </div>
      <div className="community-invitation mt-7">
        <div>
          <h2 className="text-xl font-semibold">Ready to share something playable?</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Use only code and assets you have permission to publish. Source sharing is always
            optional.
          </p>
        </div>
        <Link className="community-button primary" href="/login?callbackUrl=%2Fupload">
          Sign in to share your game
        </Link>
      </div>
    </CommunityShell>
  )
}
