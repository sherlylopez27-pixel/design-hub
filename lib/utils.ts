import type { ProjectStatus } from './types/database'

export const CHART_COLORS = [
  '#4F46E5',
  '#06B6D4',
  '#F59E0B',
  '#EC4899',
  '#10B981',
  '#8B5CF6',
]

export function isProjectLive(status: ProjectStatus, deadline: string | null): boolean {
  if (status !== 'active') return false
  if (!deadline) return true
  return new Date(deadline) >= new Date(new Date().toDateString())
}

export function getEffectiveStatus(
  status: ProjectStatus,
  deadline: string | null
): 'draft' | 'active' | 'closed' {
  if (status === 'draft') return 'draft'
  if (status === 'closed') return 'closed'
  if (deadline && new Date(deadline) < new Date(new Date().toDateString())) return 'closed'
  return 'active'
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return ''
  const d = new Date(deadline)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'Closed'
  if (diffDays === 0) return 'Closes today'
  if (diffDays === 1) return 'Closes tomorrow'
  return `Closes in ${diffDays} days`
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '')
}

export function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function calcPercentages(
  counts: { version_id: string; vote_count: number }[],
  total: number
): Record<string, number> {
  if (total === 0) return {}
  const result: Record<string, number> = {}
  for (const c of counts) {
    result[c.version_id] = Math.round((c.vote_count / total) * 100)
  }
  return result
}

export function findWinner(
  counts: { version_id: string; vote_count: number }[]
): string | null {
  if (!counts.length) return null
  const sorted = [...counts].sort((a, b) => b.vote_count - a.vote_count)
  if (sorted[0].vote_count === 0) return null
  if (sorted.length > 1 && sorted[0].vote_count === sorted[1].vote_count) return null
  return sorted[0].version_id
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
