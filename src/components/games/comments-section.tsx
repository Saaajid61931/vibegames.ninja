"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, MessageCircle } from "lucide-react"
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
  user: CommentUser
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (loading) {
      return
    }

    const trimmed = content.trim()
    if (!trimmed) {
      setError("Comment cannot be empty")
      return
    }

    if (!session?.user?.id) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/play/${slug}`)}`)
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/games/${gameId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment")
      }

      setComments((prev) => [data.comment as CommentItem, ...prev])
      setCommentsCount(Number(data.commentsCount) || commentsCount + 1)
      setContent("")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to post comment")
    } finally {
      setLoading(false)
    }
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

        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 pb-4 border-b border-[#222] last:border-0">
                <Avatar className="h-8 w-8 border border-[#4a4a6a]">
                  <AvatarImage src={comment.user.image || undefined} />
                  <AvatarFallback className="text-xs bg-[#1a1a2e] text-[#4a4a6a]">
                    {getInitials(comment.user.name || comment.user.username || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-arcade text-sm text-[#ffff00]">
                      @{comment.user.username || comment.user.name}
                    </span>
                    <span className="text-xs text-[#4a4a6a] font-arcade">
                      {timeAgo(new Date(comment.createdAt))}
                    </span>
                  </div>
                  <p className="text-[#e5e5e5] text-sm leading-relaxed font-arcade">{comment.content}</p>
                </div>
              </div>
            ))}
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
