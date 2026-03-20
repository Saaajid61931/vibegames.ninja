"use client"

import { useEffect, useRef } from "react"
import { Bot, User, Cpu } from "lucide-react"

interface Message {
  id: string
  role: "USER" | "ASSISTANT" | "SYSTEM"
  content: string
  createdAt: string
}

interface ConversationPanelProps {
  messages: Message[]
}

const roleConfig: Record<
  Message["role"],
  { icon: typeof Bot; bg: string; label: string; accent: string; border: string }
> = {
  USER: {
    icon: User,
    bg: "bg-[#0f1728]",
    label: "PLAYER",
    accent: "text-[#818cf8]",
    border: "border-[#818cf8]",
  },
  ASSISTANT: {
    icon: Bot,
    bg: "bg-[#1a1a2e]",
    label: "ARCADE CPU",
    accent: "text-[#ffff00]",
    border: "border-[#0080ff]",
  },
  SYSTEM: {
    icon: Cpu,
    bg: "bg-[#0b0f1a]",
    label: "SYSTEM",
    accent: "text-[#6b7fa3]",
    border: "border-[#4a4a6a]",
  },
}

export function ConversationPanel({ messages }: ConversationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border-4 border-[#0080ff] bg-[#1a1a2e] shadow-[4px_4px_0_#ff0040]">
            <Bot className="h-8 w-8 text-[#ffff00]" />
          </div>
          <p className="font-pixel text-base text-white">READY PLAYER ONE</p>
          <p className="mx-auto mt-4 max-w-xs font-pixel text-[10px] uppercase tracking-widest text-[#6b7fa3]">
            Pick a starter template or describe a game concept to begin. Every change will
            be logged here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 bg-[#0a0e17]/50">
      {messages.map((msg) => {
        const config = roleConfig[msg.role]
        const Icon = config.icon
        return (
          <div key={msg.id} className={`border-2 ${config.border} ${config.bg} p-4 shadow-[4px_4px_0_#000]`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${config.accent}`} />
              <span className={`font-pixel text-[10px] font-bold tracking-[0.1em] ${config.accent}`}>
                {config.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#c7d6f6] font-sans">{msg.content}</p>
          </div>
        )
      })}
    </div>
  )
}

