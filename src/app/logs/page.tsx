'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import ActivityLogItem from '@/components/ActivityLogItem'
import GlassCard from '@/components/GlassCard'
import HolographicText from '@/components/HolographicText'
import NeonButton from '@/components/NeonButton'
import NeonBadge from '@/components/NeonBadge'
import { Activity, RefreshCw, Filter } from 'lucide-react'

interface Log {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  source: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all')

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    setLoading(true)
    try {
      const res = await fetch('/api/logs')
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter)

  const errorCount = logs.filter(l => l.level === 'error').length
  const warnCount = logs.filter(l => l.level === 'warn').length
  const infoCount = logs.filter(l => l.level === 'info').length

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 
        bg-space-800/80 backdrop-blur-xl 
        border-b border-neon-cyan/10 
        px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 border border-neon-green/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,157,0.2)]">
              <Activity className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <HolographicText size="xl" variant="multi">Logs</HolographicText>
              <p className="text-sm text-gray-500 font-mono">
                {infoCount} info · {warnCount} warnings · {errorCount} errors
              </p>
            </div>
          </div>
          <NeonButton 
            variant="outline" 
            onClick={fetchLogs}
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </NeonButton>
        </div>
      </header>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <GlassCard className="p-4 flex items-center gap-3" hover={false}>
            <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">{logs.length}</p>
              <p className="text-xs text-gray-500 font-mono uppercase">Total</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-3" hover={false}>
            <div className="w-10 h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-neon-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">{infoCount}</p>
              <p className="text-xs text-gray-500 font-mono uppercase">Info</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-3" hover={false}>
            <div className="w-10 h-10 rounded-lg bg-neon-yellow/10 border border-neon-yellow/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-neon-yellow" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">{warnCount}</p>
              <p className="text-xs text-gray-500 font-mono uppercase">Warnings</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-3" hover={false}>
            <div className="w-10 h-10 rounded-lg bg-neon-red/10 border border-neon-red/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-neon-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">{errorCount}</p>
              <p className="text-xs text-gray-500 font-mono uppercase">Errors</p>
            </div>
          </GlassCard>
        </div>

        {/* Filter */}
        <GlassCard className="p-4 mb-6" hover={false}>
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-neon-cyan" />
            <div className="flex gap-2 flex-wrap">
              {(['all', 'info', 'warn', 'error'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-mono ${
                    filter === level
                      ? level === 'error' ? 'bg-neon-red/20 text-neon-red border border-neon-red/50' :
                        level === 'warn' ? 'bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/50' :
                        level === 'info' ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' :
                        'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                      : 'bg-space-700 text-gray-400 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-neon-cyan/20 rounded-full animate-spin" />
              <div className="absolute inset-0 w-16 h-16 border-t-2 border-neon-cyan rounded-full animate-spin" />
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <GlassCard className="py-20 text-center" hover={false}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-green/10 to-neon-cyan/10 border border-neon-green/20 flex items-center justify-center">
              <Activity className="w-10 h-10 text-neon-green/50" />
            </div>
            <h3 className="text-lg font-medium text-gray-400 font-mono mb-2">No logs found</h3>
            <p className="text-gray-500">{filter === 'all' ? 'No logs available' : `No ${filter} logs`}</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log, index) => (
              <ActivityLogItem key={index} {...log} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
