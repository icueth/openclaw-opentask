'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import NodeCard from '@/components/NodeCard'
import GlassCard from '@/components/GlassCard'
import HolographicText from '@/components/HolographicText'
import NeonButton from '@/components/NeonButton'
import NeonBadge from '@/components/NeonBadge'
import { Server, RefreshCw } from 'lucide-react'

interface Node {
  id: string
  name: string
  ip: string
  status: 'online' | 'offline'
  platform: string
  version: string
  lastSeen: string
}

export default function NodesPage() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNodes()
  }, [])

  async function fetchNodes() {
    setLoading(true)
    try {
      const res = await fetch('/api/nodes')
      const data = await res.json()
      setNodes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch nodes:', error)
    } finally {
      setLoading(false)
    }
  }

  const onlineNodes = nodes.filter(n => n.status === 'online')
  const offlineNodes = nodes.filter(n => n.status === 'offline')

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 
        bg-space-800/80 backdrop-blur-xl 
        border-b border-neon-cyan/10 
        px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-green/20 border border-neon-cyan/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <Server className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <HolographicText size="xl" variant="multi">Nodes</HolographicText>
              <p className="text-sm text-gray-500 font-mono">
                {onlineNodes.length} online · {offlineNodes.length} offline
              </p>
            </div>
          </div>
          <NeonButton 
            variant="outline" 
            onClick={fetchNodes}
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </NeonButton>
        </div>
      </header>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <GlassCard className="p-4 flex items-center gap-4" hover={false}>
            <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
              <Server className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">{nodes.length}</p>
              <p className="text-xs text-gray-500 font-mono uppercase">Total Nodes</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-4" hover={false}>
            <div className="w-12 h-12 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-neon-green animate-pulse shadow-[0_0_10px_rgba(0,255,157,0.8)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">{onlineNodes.length}</p>
              <p className="text-xs text-gray-500 font-mono uppercase">Online</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-4" hover={false}>
            <div className="w-12 h-12 rounded-xl bg-neon-red/10 border border-neon-red/30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-neon-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">{offlineNodes.length}</p>
              <p className="text-xs text-gray-500 font-mono uppercase">Offline</p>
            </div>
          </GlassCard>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-neon-cyan/20 rounded-full animate-spin" />
              <div className="absolute inset-0 w-16 h-16 border-t-2 border-neon-cyan rounded-full animate-spin" />
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <GlassCard className="py-20 text-center" hover={false}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-cyan/10 to-neon-green/10 border border-neon-cyan/20 flex items-center justify-center">
              <Server className="w-10 h-10 text-neon-cyan/50" />
            </div>
            <h3 className="text-lg font-medium text-gray-400 font-mono mb-2">No nodes connected</h3>
            <p className="text-gray-500">Connect a node to see it here</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nodes.map((node) => (
              <NodeCard key={node.id} {...node} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
