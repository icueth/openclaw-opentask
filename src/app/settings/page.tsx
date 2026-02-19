'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import HolographicText from '@/components/HolographicText'
import NeonButton from '@/components/NeonButton'
import NeonBadge from '@/components/NeonBadge'
import { 
  Settings, RotateCcw, AlertCircle, Lock, Key, ChevronRight, Bot, Cpu, Save, RefreshCw
} from 'lucide-react'
import Link from 'next/link'

const MODEL_OPTIONS = [
  { value: 'kimi-coding/kimi-for-coding', label: 'Kimi Code (Default)' },
  { value: 'kimi-coding/k2p5', label: 'Kimi K2.5' },
  { value: 'moonshot/kimi-2.5', label: 'Kimi 2.5' },
  { value: 'moonshot/kimi-k2.5', label: 'Kimi K2.5 (Alt)' }
]

const THINKING_OPTIONS = [
  { value: 'off', label: 'Off (Fastest)' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium (Default)' },
  { value: 'high', label: 'High' }
]

export default function SettingsPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [gitAuthStatus, setGitAuthStatus] = useState<any>(null)
  
  // TaskMan Settings
  const [taskManSettings, setTaskManSettings] = useState({
    gatewayToken: '',
    gatewayPassword: '',
    taskModel: 'kimi-coding/kimi-for-coding',
    taskThinking: 'medium'
  })
  const [originalTaskManSettings, setOriginalTaskManSettings] = useState<any>(null)
  const [savingTaskMan, setSavingTaskMan] = useState(false)

  useEffect(() => {
    fetchGitAuthStatus()
    fetchTaskManSettings()
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

  async function fetchTaskManSettings() {
    try {
      const res = await fetch('/api/settings/system')
      const data = await res.json()
      if (data.success) {
        setTaskManSettings({
          gatewayToken: '',
          gatewayPassword: '',
          taskModel: data.settings.taskModel || 'kimi-coding/kimi-for-coding',
          taskThinking: data.settings.taskThinking || 'medium'
        })
        setOriginalTaskManSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch TaskMan settings:', error)
    }
  }

  async function saveTaskManSettings() {
    setSavingTaskMan(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskManSettings)
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'TaskMan settings saved!' })
        setOriginalTaskManSettings(data.settings)
        setTaskManSettings(s => ({ ...s, gatewayToken: '', gatewayPassword: '' }))
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSavingTaskMan(false)
    }
  }

  async function setupTaskMan() {
    try {
      const res = await fetch('/api/setup-taskman', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'TaskMan agent setup complete!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Setup failed' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
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

        {/* TaskMan Settings */}
        <GlassCard variant="purple" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-neon-purple" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white font-mono">TaskMan Configuration</h2>
              <p className="text-sm text-gray-500 font-mono">Configure the task execution agent</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Gateway Token */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">
                Gateway Token {originalTaskManSettings?.hasToken && <span className="text-neon-green">(Configured)</span>}
              </label>
              <input
                type="password"
                value={taskManSettings.gatewayToken}
                onChange={(e) => setTaskManSettings({ ...taskManSettings, gatewayToken: e.target.value })}
                placeholder={originalTaskManSettings?.hasToken ? '••••••••' : 'Enter gateway token'}
                className="w-full px-4 py-3 rounded-xl bg-space-900 border border-space-700 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-colors font-mono"
              />
            </div>

            {/* Model Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Task Model
                </label>
                <select
                  value={taskManSettings.taskModel}
                  onChange={(e) => setTaskManSettings({ ...taskManSettings, taskModel: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-space-900 border border-space-700 text-white focus:border-neon-purple focus:outline-none transition-colors font-mono"
                >
                  {MODEL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Thinking Level</label>
                <select
                  value={taskManSettings.taskThinking}
                  onChange={(e) => setTaskManSettings({ ...taskManSettings, taskThinking: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-space-900 border border-space-700 text-white focus:border-neon-purple focus:outline-none transition-colors font-mono"
                >
                  {THINKING_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Setup & Save Buttons */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-space-700">
              <NeonButton variant="yellow" onClick={setupTaskMan}>
                Setup TaskMan Agent
              </NeonButton>
              <NeonButton
                variant="purple"
                onClick={saveTaskManSettings}
                disabled={savingTaskMan}
                icon={savingTaskMan ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              >
                {savingTaskMan ? 'Saving...' : 'Save Settings'}
              </NeonButton>
            </div>
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
