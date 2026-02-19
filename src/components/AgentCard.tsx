'use client'

import Link from 'next/link'
import GlassCard from './GlassCard'
import NeonButton from './NeonButton'
import { Agent } from '@/types/agent'
import { Cpu, Eye, CheckCircle } from 'lucide-react'

interface AgentCardProps {
  agent: Agent
}

export default function AgentCard({ agent }: AgentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-neon-green'
      case 'inactive':
        return 'bg-gray-500'
      default:
        return 'bg-neon-cyan'
    }
  }

  return (
    <GlassCard className="p-5 hover:border-neon-cyan/50 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{agent.emoji || '🤖'}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{agent.name}</h3>
              <span className="text-xs text-gray-500 font-mono">({agent.id})</span>
              {agent.isDefault && (
                <span className="px-1.5 py-0.5 bg-neon-cyan/20 text-neon-cyan text-[10px] rounded border border-neon-cyan/30">
                  DEFAULT
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)} animate-pulse`} />
              <span className="text-xs text-gray-400 capitalize">{agent.status}</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center">
          <Link href={`/agents/${encodeURIComponent(agent.id)}`}>
            <NeonButton variant="cyan" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
              View Details →
            </NeonButton>
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent mb-4" />

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Model</span>
          <span className="text-gray-300 font-mono text-xs truncate max-w-[200px]">{agent.model}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Workspace</span>
          <span className="text-gray-300 font-mono text-xs truncate max-w-[200px]">
            {agent.workspace.split('/').pop()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Tasks Completed</span>
          <div className="flex items-center gap-1 text-neon-green">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="font-mono">{agent.tasksCompleted || 0}</span>
          </div>
        </div>
      </div>

      {/* Description if available */}
      {agent.description && (
        <div className="mt-4 pt-3 border-t border-space-700">
          <p className="text-xs text-gray-400 line-clamp-2">{agent.description}</p>
        </div>
      )}
    </GlassCard>
  )
}
