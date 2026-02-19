'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import HolographicText from '@/components/HolographicText'
import NeonButton from '@/components/NeonButton'
import NeonBadge from '@/components/NeonBadge'
import { 
  Settings, RotateCcw, AlertCircle, Lock, Key, ChevronRight
} from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [gitAuthStatus, setGitAuthStatus] = useState<any>(null)

  useEffect(() => {
    fetchGitAuthStatus()
  }, [])

  async function fetchGitAuthStatus() {
    try {
      const res = await fetch('/api/settings/git-auth')
      const data = await res.json()
      if (data.success) {
        setGitAuthStatus(data.status)
      }
    } catch (error) {
      console.error('Failed to fetch git auth status:', error)
    }
  }

  async function restartGateway() {
    if (!confirm('Restart gateway? This may interrupt active sessions.')) return
    
    try {
      const res = await fetch('/api/gateway/restart', { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Gateway restart signal sent!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to restart' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

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
              <Settings className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <HolographicText size="xl" variant="multi">Settings</HolographicText>
              <p className="text-sm text-gray-500 font-mono">Configure your OpenClaw instance</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8 max-w-4xl mx-auto">
        {/* Message */}
        {message && (
          <GlassCard 
            variant={message.type === 'success' ? 'green' : 'pink'}
            className="p-4 flex items-center gap-3"
            hover={false}
          >
            <AlertCircle className={`w-5 h-5 ${message.type === 'success' ? 'text-neon-green' : 'text-neon-pink'}`} />
            <span className={`font-mono text-sm ${message.type === 'success' ? 'text-neon-green' : 'text-neon-pink'}`}>
              {message.text}
            </span>
          </GlassCard>
        )}

        {/* Git Authentication */}
        <GlassCard variant="cyan" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                <Lock className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white font-mono">Git Authentication</h2>
                <p className="text-sm text-gray-500 font-mono">Configure GitHub OAuth for Git push operations</p>
              </div>
            </div>
            <Link 
              href="/settings/git-auth"
              className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 rounded-lg hover:bg-neon-cyan/30 transition-colors font-mono text-sm"
            >
              <Key className="w-4 h-4" />
              Configure
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-space-800/50 rounded-xl border border-space-600/50">
            <div className={`w-3 h-3 rounded-full ${gitAuthStatus?.configured ? 'bg-neon-green animate-pulse' : 'bg-gray-500'}`} />
            <div className="flex-1">
              <p className="font-medium text-white font-mono">
                {gitAuthStatus?.configured 
                  ? `Configured: ${gitAuthStatus.method.toUpperCase()} (${gitAuthStatus.provider})`
                  : 'Not Configured'
                }
              </p>
              {gitAuthStatus?.username && (
                <p className="text-sm text-gray-400 font-mono">User: {gitAuthStatus.username}</p>
              )}
            </div>
            <NeonBadge variant={gitAuthStatus?.configured ? 'green' : 'default'} size="sm">
              {gitAuthStatus?.configured ? 'Active' : 'Inactive'}
            </NeonBadge>
          </div>
        </GlassCard>

        {/* Gateway Management */}
        <GlassCard variant="yellow" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-yellow/10 border border-neon-yellow/30 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-neon-yellow" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white font-mono">Gateway Management</h2>
                <p className="text-sm text-gray-500 font-mono">Restart the OpenClaw gateway service</p>
              </div>
            </div>
            <NeonButton 
              variant="yellow" 
              onClick={restartGateway}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Restart Gateway
            </NeonButton>
          </div>
          
          <div className="p-4 bg-space-800/50 rounded-xl border border-space-600/50">
            <p className="text-sm text-gray-400 font-mono">
              Restarting the gateway will briefly interrupt any active sessions. 
              All connected nodes will automatically reconnect once the gateway is back online.
            </p>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  )
}
