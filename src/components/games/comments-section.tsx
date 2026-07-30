"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { CornerDownRight, Loader2, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getInitials, timeAgo } from "@/lib/utils"

interface CommentUser {
  id: string
  name: string | null
  username: string | null
  image: string | null
}

interface CommentItem {
  id: string
  content: string
  createdAt: string | Date
  parentId?: string | null
  user: CommentUser
}

interface ThreadedComment extends CommentItem {
  replies: ThreadedComment[]
}

interface CommentsSectionProps {
  gameId: string
  slug: string
  initialComments: CommentItem[]
  initialCommentsCount: number
}

export function CommentsSection({
  gameId,
  slug,
  initialComments,
  initialCommentsCount,
}: CommentsSectionProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const [comments, setComments] = useState(initialComments)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError, setReplyError] = useState("")

  const threadedComments = useMemo<ThreadedComment[]>(() => {
    const nodes = comments
      .map((comment) => ({
        ...comment,
        createdAt: new Date(comment.createdAt),
        replies: [] as ThreadedComment[],
      }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    const commentMap = new Map(nodes.map((comment) => [comment.id, comment]))
    const roots: ThreadedComment[] = []

    for (const comment of nodes) {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId)
        if (parent) {
          parent.replies.push(comment)
          continue
        }
      }

      roots.push(comment)
    }

    const sortReplies = (items: ThreadedComment[]) => {
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      for (const item of items) {
        sortReplies(item.replies)
      }
    }

    sortReplies(roots)
    roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return roots
  }, [comments])

  const ensureAuthenticated = () => {
    if (session?.user?.id) {
      return true
    }

    router.push(`/login?callbackUrl=${encodeURIComponent(`/play/${slug}`)}`)
    return false
  }

  const submitComment = async ({ nextContent, parentId }: { nextContent: string; parentId?: string | null }) => {
    const trimmed = nextContent.trim()
    if (!trimmed) {
      throw new Error("Comment cannot be empty")
    }

    const res = await fetch(`/api/games/${gameId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed, parentId }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || "Failed to post comment")
    }

    setComments((prev) => [data.comment as CommentItem, ...prev])
    setCommentsCount((prev) => Number(data.commentsCount) || prev + 1)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (loading) {
      return
    }

    if (!content.trim()) {
      setError("Comment cannot be empty")
      return
    }

    if (!ensureAuthenticated()) {
      return
    }

    setLoading(true)
    setError("")

    try {
      await submitComment({ nextContent: content, parentId: null })
      setContent("")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to post comment")
    } finally {
      setLoading(false)
    }
  }

  const handleReplySubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!replyingTo || replyLoading) {
      return
    }

    if (!replyContent.trim()) {
      setReplyError("Reply cannot be empty")
      return
    }

    if (!ensureAuthenticated()) {
      return
    }

    setReplyLoading(true)
    setReplyError("")

    try {
      await submitComment({ nextContent: replyContent, parentId: replyingTo })
      setReplyContent("")
      setReplyingTo(null)
    } catch (submitError) {
      setReplyError(submitError instanceof Error ? submitError.message : "Failed to post reply")
    } finally {
      setReplyLoading(false)
    }
  }

  const renderComment = (comment: ThreadedComment, depth = 0) => {
    const isReplyingHere = replyingTo === comment.id
    const author = comment.user.username || comment.user.name || "user"

    return (
      <div key={comment.id} className={depth > 0 ? "ml-4 border-l border-[var(--color-border)] pl-4 sm:ml-6" : ""}>
        <div className="flex gap-3 border-b border-[var(--color-border)] pb-4 last:border-b-0">
          <Avatar className="h-9 w-9 border border-[var(--color-border-strong)]">
            <AvatarImage src={comment.user.image || undefined} />
            <AvatarFallback className="bg-[var(--color-surface-2)] text-xs text-[var(--color-text-secondary)]">
              {getInitials(comment.user.name || comment.user.username || "U")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="break-all text-sm font-medium text-white">@{author}</span>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {timeAgo(new Date(comment.createdAt))}
              </span>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">{comment.content}</p>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-arcade-cyan)]"
                onClick={() => {
                  if (!ensureAuthenticated()) {
                    return
                  }

                  setReplyError("")
                  setReplyContent("")
                  setReplyingTo((prev) => (prev === comment.id ? null : comment.id))
                }}
              >
                <CornerDownRight className="h-3 w-3" />
                Reply
              </button>
            </div>

            {isReplyingHere && (
              <form onSubmit={handleReplySubmit} className="mt-3 space-y-2 rounded-xl border border-[var(--color-border)] bg-black/15 p-3">
                <Textarea
                  value={replyContent}
                  onChange={(event) => {
                    setReplyContent(event.target.value)
                    if (replyError) {
                      setReplyError("")
                    }
                  }}
                  maxLength={1000}
                  placeholder={`Reply to @${author}...`}
                  className="min-h-20"
                  disabled={replyLoading}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-[var(--color-text-tertiary)]">{replyContent.length}/1000</span>
                  <div className="flex gap-2 sm:justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContent("")
                        setReplyError("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={replyLoading || replyContent.trim().length === 0}>
                      {replyLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Replying...
                        </>
                      ) : (
                        "Post reply"
                      )}
                    </Button>
                  </div>
                </div>
                {replyError && <p className="text-xs text-[#ff8aa8]">{replyError}</p>}
              </form>
            )}

            {comment.replies.length > 0 && (
              <div className="mt-4 space-y-4">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section id="comments" className="vg-panel scroll-mt-24" aria-labelledby="comments-title">
      <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
        <span className="vg-kicker text-[#a78bfa]">
          <MessageCircle className="h-4 w-4" />
          Community
        </span>
        <div className="mt-3 flex items-center justify-between gap-3">
          <h2 id="comments-title" className="text-xl font-semibold text-white">Comments</h2>
          <span className="vg-chip">{commentsCount}</span>
        </div>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Join the public conversation about this game.
        </p>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (error) {
                setError("")
              }
            }}
            maxLength={1000}
            placeholder={session?.user ? "Write a comment..." : "Sign in to write a comment"}
            className="min-h-24"
            disabled={loading}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--color-text-tertiary)]">{content.length}/1000</span>
            <Button
              type="submit"
              size="sm"
              disabled={loading || content.trim().length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post comment"
              )}
            </Button>
          </div>
          {error && <p className="text-sm text-[#ff8aa8]">{error}</p>}
        </form>

        {threadedComments.length > 0 ? (
          <div className="space-y-4">
            {threadedComments.map((comment) => renderComment(comment))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-[var(--color-text-tertiary)]">
            No comments yet. Start the conversation.
          </p>
        )}
      </div>
    </section>
  )
}
