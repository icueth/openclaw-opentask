'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import HolographicText from '@/components/HolographicText'
import NeonButton from '@/components/NeonButton'
import { 
  Bot, Cpu, Key, Save, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react'

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

export default function TaskManSettingsPage() {
  const [settings, setSettings] = useState({
    gatewayToken: '',
    gatewayPassword: '',
    taskModel: 'kimi-coding/kimi-for-coding',
    taskThinking: 'medium'
  })
  const [originalSettings, setOriginalSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings/system')
      const data = await res.json()
      if (data.success) {
        setSettings({
          gatewayToken: '',
          gatewayPassword: '',
          taskModel: data.settings.taskModel || 'kimi-coding/kimi-for-coding',
          taskThinking: data.settings.taskThinking || 'medium'
        })
        setOriginalSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    setSaving(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
        setOriginalSettings(data.settings)
        // Clear password fields after save
        setSettings(s => ({ ...s, gatewayToken: '', gatewayPassword: '' }))
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <header className="sticky top-0 z-30 bg-space-800/80 backdrop-blur-xl border-b border-neon-cyan/10 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 flex items-center justify-center">
              <Bot className="w-6 h-6 text-neon-purple" />
            </div>
            <div>
              <HolographicText size="xl" variant="multi">TaskMan Settings</HolographicText>
              <p className="text-sm text-gray-500 font-mono">Configure the task execution agent</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto space-y-8">
        {/* Message */}
        {message && (
          <GlassCard 
            variant={message.type === 'success' ? 'green' : 'pink'}
            className="p-4 flex items-center gap-3"
            hover={false}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-neon-green" />
            ) : (
              <AlertCircle className="w-5 h-5 text-neon-pink" />
            )}
            <span className={`font-mono text-sm ${message.type === 'success' ? 'text-neon-green' : 'text-neon-pink'}`}>
              {message.text}
            </span>
          </GlassCard>
        )}

        {/* Gateway Configuration */}
        <GlassCard variant="cyan" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
              <Key className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white font-mono">Gateway Authentication</h2>
              <p className="text-sm text-gray-500 font-mono">Configure Gateway access for TaskMan</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">
                Gateway Token {originalSettings?.hasToken && <span className="text-neon-green">(Configured)</span>}
              </label>
              <input
                type="password"
                value={settings.gatewayToken}
                onChange={(e) => setSettings({ ...settings, gatewayToken: e.target.value })}
                placeholder={originalSettings?.hasToken ? '••••••••' : 'Enter gateway token'}
                className="w-full px-4 py-3 rounded-xl bg-space-900 border border-space-700 text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none transition-colors font-mono"
              />
              <p className="text-xs text-gray-500 mt-1 font-mono">
                From: openclaw config get gateway.auth.token
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">
                Gateway Password {originalSettings?.hasPassword && <span className="text-neon-green">(Configured)</span>}
              </label>
              <input
                type="password"
                value={settings.gatewayPassword}
                onChange={(e) => setSettings({ ...settings, gatewayPassword: e.target.value })}
                placeholder={originalSettings?.hasPassword ? '••••••••' : 'Enter gateway password'}
                className="w-full px-4 py-3 rounded-xl bg-space-900 border border-space-700 text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>
        </GlassCard>

        {/* Model Configuration */}
        <GlassCard variant="purple" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-neon-purple" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white font-mono">Model Configuration</h2>
              <p className="text-sm text-gray-500 font-mono">Select model for task execution</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Task Model</label>
              <select
                value={settings.taskModel}
                onChange={(e) => setSettings({ ...settings, taskModel: e.target.value })}
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
                value={settings.taskThinking}
                onChange={(e) => setSettings({ ...settings, taskThinking: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-space-900 border border-space-700 text-white focus:border-neon-purple focus:outline-none transition-colors font-mono"
              >
                {THINKING_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* TaskMan Setup */}
        <GlassCard variant="yellow" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-yellow/10 border border-neon-yellow/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-neon-yellow" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white font-mono">TaskMan Agent Setup</h2>
                <p className="text-sm text-gray-500 font-mono">Create the taskman agent in OpenClaw</p>
              </div>
            </div>
            <NeonButton variant="yellow" onClick={setupTaskMan}>
              Setup TaskMan
            </NeonButton>
          </div>
          
          <div className="p-4 bg-space-800/50 rounded-xl border border-space-600/50">
            <p className="text-sm text-gray-400 font-mono">
              TaskMan is the dedicated agent for executing tasks from the Dashboard.
              It uses sessions_spawn to create worker agents with the specified model and thinking level.
            </p>
          </div>
        </GlassCard>

        {/* Save Button */}
        <div className="flex justify-end">
          <NeonButton
            variant="cyan"
            onClick={saveSettings}
            disabled={saving}
            icon={saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </NeonButton>
        </div>
      </div>
    </DashboardLayout>
  )
}
