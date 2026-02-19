'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import SessionCard from '@/components/SessionCard'
import GlassCard from '@/components/GlassCard'
import HolographicText from '@/components/HolographicText'
import NeonButton from '@/components/NeonButton'
import NeonBadge from '@/components/NeonBadge'
import { MessageSquare, RefreshCw } from 'lucide-react'

interface Session {
  key_id: string
  channel: string
  model: string
  lastActivity: string
  messageCount: number
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    setLoading(true)
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      setSessions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group sessions by channel
  const sessionsByChannel = sessions.reduce((acc, session) => {
    const channel = session.channel || 'unknown'
    if (!acc[channel]) acc[channel] = []
    acc[channel].push(session)
    return acc
  }, {} as Record<string, Session[]>)

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 
        bg-space-800/80 backdrop-blur-xl 
        border-b border-neon-cyan/10 
        px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 border border-neon-purple/30 flex items-center justify-center shadow-[0_0_20px_rgba(184,41,247,0.2)]">
              <MessageSquare className="w-6 h-6 text-neon-purple" />
            </div>
            <div>
              <HolographicText size="xl" variant="multi">Sessions</HolographicText>
              <p className="text-sm text-gray-500 font-mono">{sessions.length} active sessions</p>
            </div>
          </div>
          <NeonButton 
            variant="outline" 
            onClick={fetchSessions}
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </NeonButton>
        </div>
      </header>

      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-neon-cyan/20 rounded-full animate-spin" />
              <div className="absolute inset-0 w-16 h-16 border-t-2 border-neon-cyan rounded-full animate-spin" />
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <GlassCard className="py-20 text-center" hover={false}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-purple/10 to-neon-cyan/10 border border-neon-purple/20 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-neon-purple/50" />
            </div>
            <h3 className="text-lg font-medium text-gray-400 font-mono mb-2">No active sessions</h3>
            <p className="text-gray-500">Sessions will appear when users interact with agents</p>
          </GlassCard>
        ) : (
          <div className="space-y-8">
            {Object.entries(sessionsByChannel).map(([channel, channelSessions]) => (
              <div key={channel}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-2 h-2 rounded-full ${
                    channel === 'telegram' ? 'bg-neon-cyan animate-pulse' :
                    channel === 'discord' ? 'bg-neon-purple animate-pulse' :
                    channel === 'whatsapp' ? 'bg-neon-green animate-pulse' :
                    'bg-gray-500'
                  }`} />
                  <h2 className="text-lg font-semibold text-white font-mono capitalize">{channel}</h2>
                  <NeonBadge variant={channel === 'telegram' ? 'cyan' : channel === 'discord' ? 'purple' : 'default'} size="sm">
                    {channelSessions.length}
                  </NeonBadge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channelSessions.map((session) => (
                    <SessionCard key={session.key_id} {...session} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
