import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  change?: string
  subtitle?: string
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/5',
  },
  green: {
    bg: 'bg-green-500/10',
    icon: 'text-green-400',
    border: 'border-green-500/20',
    glow: 'shadow-green-500/5',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    icon: 'text-yellow-400',
    border: 'border-yellow-500/20',
    glow: 'shadow-yellow-500/5',
  },
  red: {
    bg: 'bg-red-500/10',
    icon: 'text-red-400',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/5',
  },
  purple: {
    bg: 'bg-purple-500/10',
    icon: 'text-purple-400',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/5',
  },
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, change, subtitle }) => {
  const colors = colorMap[color]

  return (
    <div className={`card p-5 hover:border-[#3b4263] transition-all duration-300 hover:shadow-lg ${colors.glow}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400 mb-2">{title}</p>
          <p className="text-3xl font-bold text-slate-100 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {change && (
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      </div>
    </div>
  )
}

export default StatCard
