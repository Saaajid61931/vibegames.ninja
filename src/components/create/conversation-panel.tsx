"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Message {
  id: string
  role: "USER" | "ASSISTANT" | "SYSTEM"
  content: string
  createdAt: string
}

interface ConversationPanelProps {
  messages: Message[]
}

const roleBg: Record<Message["role"], string> = {
  USER: "bg-[#122037] text-[#d9efff]",
  ASSISTANT: "bg-[var(--color-surface)] text-[var(--color-text)]",
  SYSTEM: "bg-[#101726] text-[#9eb0d6]",
}

export function ConversationPanel({ messages }: ConversationPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conversation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            No messages yet. Apply a prompt or quick action to start a conversation.
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`rounded-xl px-3 py-3 ${roleBg[msg.role]}`}>
              <p className="text-[10px] uppercase tracking-wide opacity-70">{msg.role}</p>
              <p className="mt-1 text-sm leading-6">{msg.content}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
