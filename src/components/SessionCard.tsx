'use client'

import { MessageSquare, Cpu, Clock } from 'lucide-react'
import GlassCard from './GlassCard'
import NeonBadge from './NeonBadge'

interface SessionCardProps {
  key_id: string
  channel: string
  model: string
  lastActivity: string
  messageCount: number
}

const channelConfig: Record<string, { color: 'cyan' | 'purple' | 'green' | 'pink' | 'yellow' | 'default', icon: string }> = {
  telegram: { color: 'cyan', icon: 'TG' },
  discord: { color: 'purple', icon: 'DC' },
  whatsapp: { color: 'green', icon: 'WA' },
  slack: { color: 'pink', icon: 'SL' },
  signal: { color: 'cyan', icon: 'SG' },
  webchat: { color: 'yellow', icon: 'WC' },
}

export default function SessionCard({ key_id, channel, model, lastActivity, messageCount }: SessionCardProps) {
  const config = channelConfig[channel] || { color: 'default', icon: '??' }

  return (
    <GlassCard 
      variant={config.color === 'default' ? 'default' : config.color}
      className="p-4 group"
      hover={true}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <NeonBadge 
            variant={config.color} 
            size="sm"
            className="min-w-[28px] justify-center font-bold"
          >
            {config.icon}
          </NeonBadge>
          <span className="font-medium text-white capitalize font-mono tracking-wide">{channel}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span className="font-mono">{lastActivity}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="p-1.5 rounded-lg bg-space-700/50">
            <MessageSquare className="w-4 h-4 text-neon-cyan/70" />
          </div>
          <span className="text-gray-400 font-mono">{messageCount} msgs</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="p-1.5 rounded-lg bg-space-700/50">
            <Cpu className="w-4 h-4 text-neon-purple/70" />
          </div>
          <span className="text-gray-400 font-mono text-xs truncate">{model}</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-space-600/30">
        <p className="text-[10px] text-gray-600 font-mono truncate uppercase tracking-wider">
          ID: {key_id.slice(0, 16)}...
        </p>
      </div>
    </GlassCard>
  )
}
