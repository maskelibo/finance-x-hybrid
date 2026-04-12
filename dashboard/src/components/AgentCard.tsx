import React from 'react'
import { ChevronRight, Clock, Zap } from 'lucide-react'
import { Agent } from '../types'
import StatusBadge from './StatusBadge'
import { agentGroupColors } from '../data/agents'

interface AgentCardProps {
  agent: Agent
  onClick: (agent: Agent) => void
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick }) => {
  return (
    <div
      className="card p-5 hover:border-[#3b4263] hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer group"
      onClick={() => onClick(agent)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 text-base leading-tight group-hover:text-blue-300 transition-colors">
            {agent.displayName}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{agent.name}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2" />
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <StatusBadge status={agent.status} />
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${agentGroupColors[agent.group]}`}>
          {agent.group}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
        {agent.description}
      </p>

      <div className="border-t border-[#2d3148] pt-3">
        <p className="text-xs text-slate-500 mb-1.5 font-medium">Yetenekler:</p>
        <ul className="space-y-0.5">
          {agent.capabilities.slice(0, 3).map((cap, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Zap className="w-3 h-3 text-blue-500/60 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-slate-500 line-clamp-1">{cap}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#2d3148]">
        <Clock className="w-3 h-3 text-slate-600" />
        <span className="text-xs text-slate-500">
          {agent.lastRun ? `Son çalışma: ${agent.lastRun}` : 'Henüz çalışmadı'}
        </span>
      </div>
    </div>
  )
}

export default AgentCard
