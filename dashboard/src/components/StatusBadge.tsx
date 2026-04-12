import React from 'react'
import { AgentStatus } from '../types'

interface StatusBadgeProps {
  status: AgentStatus | string
  size?: 'sm' | 'md'
}

const statusConfig: Record<string, { label: string; classes: string; dotClass: string }> = {
  aktif: {
    label: 'Aktif',
    classes: 'bg-green-500/15 text-green-400 border border-green-500/30',
    dotClass: 'bg-green-400',
  },
  bekliyor: {
    label: 'Bekliyor',
    classes: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    dotClass: 'bg-yellow-400',
  },
  calisiyor: {
    label: 'Çalışıyor',
    classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    dotClass: 'bg-blue-400 animate-pulse',
  },
  hata: {
    label: 'Hata',
    classes: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dotClass: 'bg-red-400',
  },
  tamamlandi: {
    label: 'Tamamlandı',
    classes: 'bg-green-500/15 text-green-400 border border-green-500/30',
    dotClass: 'bg-green-400',
  },
  basarisiz: {
    label: 'Başarısız',
    classes: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dotClass: 'bg-red-400',
  },
  isleniyor: {
    label: 'İşleniyor',
    classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    dotClass: 'bg-blue-400 animate-pulse',
  },
  pozitif: {
    label: 'Pozitif',
    classes: 'bg-green-500/15 text-green-400 border border-green-500/30',
    dotClass: 'bg-green-400',
  },
  negatif: {
    label: 'Negatif',
    classes: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dotClass: 'bg-red-400',
  },
  'nötr': {
    label: 'Nötr',
    classes: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    dotClass: 'bg-slate-400',
  },
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const known = statusConfig[status]
  if (!known && status) {
    console.warn(`[StatusBadge] Bilinmeyen status: "${status}"`)
  }
  const config = known ?? {
    label: status || '?',
    classes: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    dotClass: 'bg-slate-400',
  }

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.classes} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  )
}

export default StatusBadge
