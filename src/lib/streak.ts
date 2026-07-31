import type { StreakInfo } from '../types'

export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`)
  const db = new Date(`${b}T00:00:00`)
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

export function applyCompletion(streak: StreakInfo, dateKey: string): StreakInfo {
  if (streak.lastCompletedDate === dateKey) {
    return streak // 오늘 이미 완료 처리됨(복습 모드 재진입 등)
  }
  const isConsecutive = streak.lastCompletedDate !== null && daysBetween(streak.lastCompletedDate, dateKey) === 1
  const current = isConsecutive ? streak.current + 1 : 1
  return {
    current,
    longest: Math.max(streak.longest, current),
    lastCompletedDate: dateKey,
  }
}

export function isTodayCompleted(streak: StreakInfo): boolean {
  return streak.lastCompletedDate === todayKey()
}

/** 마지막 완료일 이후 하루 이상 비어있으면 스트릭이 깨진 것으로 표시(조회용) */
export function isStreakActive(streak: StreakInfo): boolean {
  if (!streak.lastCompletedDate) return false
  const gap = daysBetween(streak.lastCompletedDate, todayKey())
  return gap <= 1
}
