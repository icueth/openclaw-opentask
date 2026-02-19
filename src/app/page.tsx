'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import StatCard from '@/components/StatCard'
import NodeCard from '@/components/NodeCard'
import ActivityLogItem from '@/components/ActivityLogItem'
import GlassCard from '@/components/GlassCard'
import HolographicText from '@/components/HolographicText'
import { 
  Activity, Server, Clock, RefreshCw,
  Globe, FolderKanban, Cpu
} from 'lucide-react'

interface GatewayStatus {
  status: string
  uptime: number
  version: string
  model: string
  nodeCount: number
  sessionCount: number
  totalTokens: number
  agentCount?: number
}

interface Node {
  id: string
  name: string
  ip: string
  status: 'online' | 'offline'
  platform: string
  version: string
  lastSeen: string
}

interface Project {
  id: string
  name: string
  status: string
  updatedAt: string
}

interface Log {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  source: string
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
  return tokens.toString()
}

export default function Dashboard() {
  const [status, setStatus] = useState<GatewayStatus | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchAllData() {
    try {
      const [statusRes, nodesRes, projectsRes, logsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/nodes'),
        fetch('/api/projects'),
        fetch('/api/logs'),
      ])

      const statusData = await statusRes.json()
      const nodesData = await nodesRes.json()
      const projectsData = await projectsRes.json()
      const logsData = await logsRes.json()

      setStatus(statusData)
      setNodes(Array.isArray(nodesData) ? nodesData : nodesData.nodes || [])
      setProjects(Array.isArray(projectsData) ? projectsData : projectsData.projects || [])
      setLogs(Array.isArray(logsData) ? logsData : logsData.logs || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchAllData()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-neon-cyan/20 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-t-2 border-neon-cyan rounded-full animate-spin" />
            <div className="absolute inset-4 w-8 h-8 bg-neon-cyan/20 rounded-full animate-pulse blur-md" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const isOnline = status?.status === 'online'

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 
        bg-space-800/80 backdrop-blur-xl 
        border-b border-neon-cyan/10 
        px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <Globe className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <HolographicText size="xl" variant="multi">OpenClaw Dashboard</HolographicText>
              <p className="text-sm text-gray-500 font-mono">Welcome back! Manage your agents and projects.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <GlassCard className="flex items-center gap-3 px-4 py-2" hover={false}>
              <div className="relative">
                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-neon-green' : 'bg-neon-red'} ${isOnline ? 'animate-pulse' : ''}`} />
                {isOnline && (
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-neon-green animate-ping opacity-50" />
                )}
              </div>
              <span className={`text-sm font-mono uppercase tracking-wider ${isOnline ? 'text-neon-green' : 'text-neon-red'}`}>
                {status?.status || 'unknown'}
              </span>
            </GlassCard>
            <button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-space-700 border border-space-600 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all duration-200 disabled:opacity-50 group"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
            </button>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Agents" 
            value={status?.agentCount || 0} 
            icon={<Cpu className="w-6 h-6" />} 
            color="cyan" 
          />
          <StatCard 
            title="Projects" 
            value={projects.length} 
            icon={<FolderKanban className="w-6 h-6" />} 
            color="purple" 
          />
          <StatCard 
            title="Nodes Online" 
            value={status?.nodeCount || nodes.filter(n => n.status === 'online').length} 
            icon={<Server className="w-6 h-6" />} 
            color="green" 
          />
          <StatCard 
            title="Uptime" 
            value={formatUptime(status?.uptime || 0)} 
            icon={<Clock className="w-6 h-6" />} 
            color="yellow" 
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4 text-neon-purple" />
                </div>
                <h2 className="text-lg font-semibold text-white font-mono">Recent Projects</h2>
              </div>
            </div>
            <div className="space-y-3">
              {projects.slice(0, 4).map((project) => (
                <GlassCard key={project.id} className="p-4" hover={true}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center">
                        <FolderKanban className="w-4 h-4 text-neon-purple" />
                      </div>
                      <div>
                        <p className="font-medium text-white font-mono">{project.name}</p>
                        <p className="text-xs text-gray-500 font-mono capitalize">{project.status}</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
              {projects.length === 0 && (
                <GlassCard className="py-12 text-center" hover={false}>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-space-700 flex items-center justify-center">
                    <FolderKanban className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-500 font-mono">No projects yet</p>
                </GlassCard>
              )}
            </div>
          </div>

          {/* Connected Nodes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                  <Server className="w-4 h-4 text-neon-cyan" />
                </div>
                <h2 className="text-lg font-semibold text-white font-mono">Connected Nodes</h2>
              </div>
            </div>
            <div className="space-y-3">
              {nodes.slice(0, 4).map((node) => (
                <NodeCard key={node.id} {...node} />
              ))}
              {nodes.length === 0 && (
                <GlassCard className="py-12 text-center" hover={false}>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-space-700 flex items-center justify-center">
                    <Server className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-500 font-mono">No nodes connected</p>
                </GlassCard>
              )}
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-neon-green" />
            </div>
            <h2 className="text-lg font-semibold text-white font-mono">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {logs.slice(0, 6).map((log, index) => (
              <ActivityLogItem key={index} {...log} />
            ))}
            {logs.length === 0 && (
              <GlassCard className="py-12 text-center" hover={false}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-space-700 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500 font-mono">No recent activity</p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
