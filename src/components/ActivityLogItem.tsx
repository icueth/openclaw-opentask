'use client'

import { AlertCircle, Info, AlertTriangle, Clock } from 'lucide-react'
import GlassCard from './GlassCard'

interface ActivityLogProps {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  source: string
}

const levelConfig = {
  info: { 
    icon: Info, 
    color: 'text-neon-cyan', 
    bg: 'bg-neon-cyan/10',
    border: 'border-neon-cyan/30',
    glow: 'shadow-[0_0_10px_rgba(0,240,255,0.1)]'
  },
  warn: { 
    icon: AlertTriangle, 
    color: 'text-neon-yellow', 
    bg: 'bg-neon-yellow/10',
    border: 'border-neon-yellow/30',
    glow: 'shadow-[0_0_10px_rgba(255,238,0,0.1)]'
  },
  error: { 
    icon: AlertCircle, 
    color: 'text-neon-red', 
    bg: 'bg-neon-red/10',
    border: 'border-neon-red/30',
    glow: 'shadow-[0_0_10px_rgba(255,51,51,0.1)]'
  },
}

export default function ActivityLogItem({ timestamp, level, message, source }: ActivityLogProps) {
  const config = levelConfig[level]
  const Icon = config.icon

  return (
    <GlassCard 
      className="p-3 group"
      hover={true}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg ${config.bg} ${config.border} border
          transition-all duration-300
          group-hover:${config.glow}
        `}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-300 break-all font-mono leading-relaxed">{message}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="px-2 py-0.5 rounded bg-space-700/50 text-gray-400 font-mono uppercase">
              {source}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="font-mono">{timestamp}</span>
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
