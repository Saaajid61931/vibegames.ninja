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
      <div key={comment.id} className={depth > 0 ? "ml-4 border-l border-[#2e3446] pl-4 sm:ml-6" : ""}>
        <div className="flex gap-3 pb-4 border-b border-[#222] last:border-b-0">
          <Avatar className="h-8 w-8 border border-[#4a4a6a]">
            <AvatarImage src={comment.user.image || undefined} />
            <AvatarFallback className="text-xs bg-[#1a1a2e] text-[#4a4a6a]">
              {getInitials(comment.user.name || comment.user.username || "U")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-arcade text-sm text-[#ffff00] break-all">@{author}</span>
              <span className="text-xs text-[#4a4a6a] font-arcade">
                {timeAgo(new Date(comment.createdAt))}
              </span>
            </div>

            <p className="text-[#e5e5e5] text-sm leading-relaxed font-arcade whitespace-pre-wrap">{comment.content}</p>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] font-arcade text-[#4a4a6a] hover:text-[#ffff00] transition-colors"
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
                REPLY
              </button>
            </div>

            {isReplyingHere && (
              <form onSubmit={handleReplySubmit} className="mt-3 space-y-2 rounded-md border border-[#2e3446] bg-[#111626] p-3">
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
                  className="min-h-[80px] font-arcade"
                  disabled={replyLoading}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[10px] text-[#4a4a6a] font-arcade">{replyContent.length}/1000</span>
                  <div className="flex gap-2 sm:justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="font-arcade"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContent("")
                        setReplyError("")
                      }}
                    >
                      CANCEL
                    </Button>
                    <Button type="submit" size="sm" className="font-arcade" disabled={replyLoading || replyContent.trim().length === 0}>
                      {replyLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          REPLYING...
                        </>
                      ) : (
                        "POST REPLY"
                      )}
                    </Button>
                  </div>
                </div>
                {replyError && <p className="text-xs text-[#ff0040] font-arcade">{replyError}</p>}
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
    <div className="border-2 border-[#4a4a6a]">
      <div className="border-b-2 border-[#4a4a6a] px-4 py-3 flex items-center gap-2 bg-[#1a1a2e]">
        <MessageCircle className="h-4 w-4 text-[#ffff00]" />
        <span className="font-arcade text-sm">COMMENTS [{commentsCount}]</span>
      </div>

      <div className="p-3 sm:p-4 bg-[#0d0d15] space-y-4">
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
            placeholder={session?.user ? "Share your feedback..." : "Log in to write a comment"}
            className="font-arcade min-h-[90px]"
            disabled={loading}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[#4a4a6a] font-arcade">{content.length}/1000</span>
            <Button
              type="submit"
              size="sm"
              className="font-arcade"
              disabled={loading || content.trim().length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  POSTING...
                </>
              ) : (
                "POST COMMENT"
              )}
            </Button>
          </div>
          {error && <p className="text-xs text-[#ff0040] font-arcade">{error}</p>}
        </form>

        {threadedComments.length > 0 ? (
          <div className="space-y-4">
            {threadedComments.map((comment) => renderComment(comment))}
          </div>
        ) : (
          <p className="text-[#4a4a6a] text-center py-8 font-arcade">
            NO_COMMENTS_FOUND. Be the first to comment.
          </p>
        )}
      </div>
    </div>
  )
}
