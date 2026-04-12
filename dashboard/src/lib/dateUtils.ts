/**
 * Centralized date/time formatting for Finance X dashboard.
 * All Turkish locale, consistent across the app.
 */

const MONTHS_SHORT_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    const day = d.getDate()
    const month = MONTHS_SHORT_TR[d.getMonth()]
    const year = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${day} ${month} ${year} ${hh}:${mm}`
  } catch {
    return iso
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    const day = d.getDate()
    const month = MONTHS_SHORT_TR[d.getMonth()]
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
  } catch {
    return iso
  }
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    const diffMs = Date.now() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 10) return 'az önce'
    if (diffSec < 60) return `${diffSec} sn önce`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} dk önce`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr} sa önce`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return `${diffDay} gün önce`
    return formatDate(iso)
  } catch {
    return iso
  }
}

export function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms < 0) return '—'
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}sn`
  const minutes = Math.floor(seconds / 60)
  const remSec = seconds % 60
  if (minutes < 60) return `${minutes}dk ${remSec}sn`
  const hours = Math.floor(minutes / 60)
  const remMin = minutes % 60
  return `${hours}sa ${remMin}dk`
}
