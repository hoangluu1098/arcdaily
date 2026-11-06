export type BudgetPeriod = 'daily' | 'weekly' | 'monthly'

export const PERIOD_LABEL: Record<BudgetPeriod, string> = {
  daily: 'Today',
  weekly: 'This week',
  monthly: 'This month',
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Weeks start on Monday. */
export function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts))
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  return d.getTime()
}

export function startOfMonth(ts: number): number {
  const d = new Date(startOfDay(ts))
  d.setDate(1)
  return d.getTime()
}

export function periodStart(period: BudgetPeriod, now: number): number {
  if (period === 'daily') return startOfDay(now)
  if (period === 'weekly') return startOfWeek(now)
  return startOfMonth(now)
}

export function dayKey(ts: number): number {
  return startOfDay(ts)
}

export function relativeTime(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts)
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function dayLabel(ts: number): string {
  const today = startOfDay(Date.now())
  const day = startOfDay(ts)
  if (day === today) return 'Today'
  if (day === today - 86_400_000) return 'Yesterday'
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
