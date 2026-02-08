import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  }
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`
    }
  }
  
  return 'Just now'
}

export const CATEGORIES = [
  { value: 'ACTION', label: 'Action', icon: '🎮' },
  { value: 'PUZZLE', label: 'Puzzle', icon: '🧩' },
  { value: 'ARCADE', label: 'Arcade', icon: '👾' },
  { value: 'STRATEGY', label: 'Strategy', icon: '♟️' },
  { value: 'ADVENTURE', label: 'Adventure', icon: '🗺️' },
  { value: 'RACING', label: 'Racing', icon: '🏎️' },
  { value: 'SPORTS', label: 'Sports', icon: '⚽' },
  { value: 'SIMULATION', label: 'Simulation', icon: '🏗️' },
  { value: 'RPG', label: 'RPG', icon: '⚔️' },
  { value: 'CASUAL', label: 'Casual', icon: '🎯' },
  { value: 'MULTIPLAYER', label: 'Multiplayer', icon: '👥' },
  { value: 'EDUCATIONAL', label: 'Educational', icon: '📚' },
  { value: 'OTHER', label: 'Other', icon: '🎲' },
] as const

export const AI_TOOLS = [
  { value: 'claude', label: 'Claude' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'copilot', label: 'GitHub Copilot' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'v0', label: 'v0.dev' },
  { value: 'other', label: 'Other' },
] as const

export const AI_MODELS = [
  { value: 'claude-3-7-sonnet', label: 'Claude 3.7 Sonnet' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4.1', label: 'GPT-4.1' },
  { value: 'o3-mini', label: 'o3-mini' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'deepseek-r1', label: 'DeepSeek R1' },
  { value: 'llama-3.1-405b', label: 'Llama 3.1 405B' },
  { value: 'other', label: 'Other / Custom' },
] as const
