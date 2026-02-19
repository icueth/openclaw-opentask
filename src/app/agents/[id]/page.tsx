'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import { Agent } from '@/types/agent'
import { 
  ArrowLeft, RefreshCw, AlertCircle, X, Cpu, Trash2, 
  FileText, Save, AlertTriangle, Edit3
} from 'lucide-react'

const WORKSPACE_FILES = [
  { name: 'SOUL.md', description: 'Agent personality and behavior' },
  { name: 'IDENTITY.md', description: 'Agent identity and persona' },
  { name: 'AGENTS.md', description: 'Workspace instructions' },
  { name: 'MEMORY.md', description: 'Long-term memory storage' },
  { name: 'TOOLS.md', description: 'Tool configurations and notes' },
  { name: 'HEARTBEAT.md', description: 'Heartbeat tasks and checks' },
  { name: 'USER.md', description: 'User information and preferences' },
]

const AVAILABLE_MODELS = [
  { id: 'default', name: 'Default (from config)' },
  { id: 'kimi-coding/kimi-for-coding', name: 'Kimi for Coding' },
  { id: 'kimi-coding/k2p5', name: 'Kimi K2.5' },
  { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
]

const EMOJI_OPTIONS = ['🤖', '🐱', '🎯', '✨', '🔥', '🚀', '💡', '🔧', '🎨', '📊', '🔍', '⚡', '🧠', '💻', '📱']

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = decodeURIComponent(params.id as string)

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showModelWarning, setShowModelWarning] = useState(false)
  const [pendingModelChange, setPendingModelChange] = useState<string | null>(null)
  const [tempModelSelection, setTempModelSelection] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    emoji: '🤖',
    model: 'default',
    description: ''
  })

  const fetchAgent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`)
      if (!res.ok) throw new Error('Failed to fetch agent')
      const data = await res.json()
      setAgent(data)
      setFormData({
        name: data.name || '',
        emoji: data.emoji || '🤖',
        model: data.model || 'default',
        description: data.description || ''
      })
    } catch (error) {
      console.error('Failed to fetch agent:', error)
      showMessage('error', 'Failed to load agent')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    fetchAgent()
  }, [fetchAgent])

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }, [])

  const handleSave = async (restartGateway = false) => {
    if (!agent) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update agent')
      }
      
      const updatedAgent = await res.json()
      setAgent(updatedAgent)
      showMessage('success', 'Agent updated successfully')
      
      if (restartGateway) {
        // Trigger gateway restart
        try {
          await fetch('/api/gateway/restart', { method: 'POST' })
          showMessage('success', 'Gateway restarted successfully')
        } catch {
          showMessage('error', 'Agent saved but failed to restart gateway')
        }
      }
      
      setShowModelWarning(false)
      setPendingModelChange(null)
    } catch (error) {
      console.error('Failed to update agent:', error)
      showMessage('error', error instanceof Error ? error.message : 'Failed to update agent')
    } finally {
      setSaving(false)
    }
  }

  const handleModelChange = (newModel: string) => {
    if (newModel !== formData.model) {
      setTempModelSelection(newModel)
      setPendingModelChange(newModel)
      setShowModelWarning(true)
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete agent')
      }
      
      router.push('/agents')
    } catch (error) {
      console.error('Failed to delete agent:', error)
      showMessage('error', error instanceof Error ? error.message : 'Failed to delete agent')
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <GlassCard className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Agent not found</p>
            <Link href="/agents" className="text-neon-cyan hover:underline mt-4 inline-block">
              ← Back to Agents
            </Link>
          </GlassCard>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-space-800/80 backdrop-blur-xl border-b border-neon-cyan/10 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/agents">
              <button className="p-2 text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{agent.emoji}</span>
              <div>
                <h1 className="text-xl font-bold text-white">{agent.name}</h1>
                <p className="text-xs text-gray-500 font-mono">{agent.id}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NeonButton
              variant="outline"
              onClick={fetchAgent}
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </NeonButton>
            <NeonButton
              variant="pink"
              onClick={() => setShowDeleteConfirm(true)}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete Agent
            </NeonButton>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Message */}
        {message && (
          <GlassCard
            variant={message.type === 'success' ? 'green' : 'pink'}
            className="mb-6 p-4 flex items-center gap-3"
          >
            {message.type === 'success' ? (
              <AlertCircle className="w-5 h-5 text-neon-green" />
            ) : (
              <AlertCircle className="w-5 h-5 text-neon-red" />
            )}
            <span className={message.type === 'success' ? 'text-neon-green' : 'text-neon-red'}>
              {message.text}
            </span>
            <button onClick={() => setMessage(null)} className="ml-auto text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agent Configuration */}
          <GlassCard variant="cyan" className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Agent Configuration</h2>
                <p className="text-xs text-gray-500">Edit agent settings</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Agent Name */}
              <div>
                <label className="block text-xs font-medium text-neon-cyan/70 uppercase tracking-wider font-mono mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-space-900/80 border border-space-600 rounded-lg text-white font-mono text-sm focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] focus:outline-none transition-all"
                />
              </div>

              {/* Emoji Picker */}
              <div>
                <label className="block text-xs font-medium text-neon-cyan/70 uppercase tracking-wider font-mono mb-2">
                  Emoji
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="flex items-center gap-3 px-4 py-3 bg-space-900/80 border border-space-600 rounded-lg hover:border-neon-cyan/50 transition-all"
                  >
                    <span className="text-2xl">{formData.emoji}</span>
                    <span className="text-sm text-gray-400">Click to change</span>
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-2 p-3 bg-space-800 border border-neon-cyan/30 rounded-lg shadow-xl z-10">
                      <div className="grid grid-cols-7 gap-2">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, emoji }))
                              setShowEmojiPicker(false)
                            }}
                            className={`w-10 h-10 rounded-lg text-xl hover:bg-neon-cyan/20 transition-colors ${
                              formData.emoji === emoji ? 'bg-neon-cyan/20 border border-neon-cyan/50' : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-neon-cyan/70 uppercase tracking-wider font-mono mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What this agent specializes in..."
                  rows={3}
                  className="w-full px-4 py-3 bg-space-900/80 border border-space-600 rounded-lg text-white placeholder-gray-600 font-mono text-sm resize-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] focus:outline-none transition-all"
                />
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-xs font-medium text-neon-cyan/70 uppercase tracking-wider font-mono mb-2">
                  Model
                </label>
                <select
                  value={tempModelSelection || formData.model}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full px-4 py-3 bg-space-900/80 border border-space-600 rounded-lg text-white font-mono text-sm focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] focus:outline-none transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                >
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-neon-yellow/70 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Changing model requires Gateway restart
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-neon-cyan/10">
                <NeonButton
                  variant="cyan"
                  onClick={() => handleSave(false)}
                  loading={saving}
                  disabled={saving}
                  icon={<Save className="w-4 h-4" />}
                  className="w-full"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </NeonButton>
              </div>
            </div>
          </GlassCard>

          {/* Workspace Section */}
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-neon-purple" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Workspace Files</h2>
                <p className="text-xs text-gray-500">Manage agent configuration files</p>
              </div>
            </div>

            {/* Workspace Location */}
            <div className="mb-6 p-4 bg-space-900/50 rounded-lg border border-space-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Location</p>
              <p className="text-sm text-gray-300 font-mono break-all">{agent.workspace}</p>
            </div>

            {/* File Links */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Edit Files</p>
              <div className="grid grid-cols-2 gap-2">
                {WORKSPACE_FILES.map((file) => (
                  <Link
                    key={file.name}
                    href={`/agents/${encodeURIComponent(agentId)}/files?file=${encodeURIComponent(file.name)}`}
                    className="flex items-center gap-2 p-3 bg-space-900/50 border border-space-700 rounded-lg hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all group"
                  >
                    <FileText className="w-4 h-4 text-gray-500 group-hover:text-neon-cyan transition-colors" />
                    <span className="text-sm text-gray-300 group-hover:text-white">{file.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Model Change Warning Modal */}
      {showModelWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <GlassCard variant="yellow" className="p-6" hover={false}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-neon-yellow/10 border border-neon-yellow/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-neon-yellow" />
                </div>
                <div>
                  <h2 className="font-semibold text-white text-lg">⚠️ Model Change Detected</h2>
                </div>
              </div>

              {/* Model Change Info */}
              <div className="mb-5 p-4 bg-space-900/50 rounded-lg border border-space-700">
                <p className="text-sm text-gray-400 mb-2">You are changing the model from:</p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-gray-500">• Old:</span>{' '}
                    <span className="text-gray-300 font-mono">{formData.model === 'default' ? 'default' : formData.model}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">• New:</span>{' '}
                    <span className="text-neon-cyan font-mono">{tempModelSelection || pendingModelChange}</span>
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="mb-5 flex items-start gap-3 p-3 rounded-lg bg-neon-yellow/5 border border-neon-yellow/20">
                <AlertTriangle className="w-5 h-5 text-neon-yellow flex-shrink-0 mt-0.5" />
                <p className="text-sm text-neon-yellow/90">
                  This requires a <strong>Gateway restart</strong> to take effect.
                </p>
              </div>

              <p className="text-sm text-gray-300 mb-4 font-medium">What would you like to do?</p>

              {/* Options */}
              <div className="space-y-3 mb-6">
                <label 
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    !pendingModelChange 
                      ? 'border-neon-cyan/50 bg-neon-cyan/5' 
                      : 'border-space-700 hover:border-neon-cyan/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="restartOption"
                    checked={!pendingModelChange}
                    onChange={() => setPendingModelChange(null)}
                    className="w-4 h-4 accent-neon-cyan mt-0.5"
                  />
                  <div>
                    <span className={`text-sm font-medium ${!pendingModelChange ? 'text-neon-cyan' : 'text-gray-300'}`}>
                      Save configuration only
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Model will change on next Gateway restart
                    </p>
                  </div>
                </label>

                <label 
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    !!pendingModelChange 
                      ? 'border-neon-cyan/50 bg-neon-cyan/5' 
                      : 'border-space-700 hover:border-neon-cyan/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="restartOption"
                    checked={!!pendingModelChange}
                    onChange={() => setPendingModelChange(tempModelSelection || pendingModelChange || formData.model)}
                    className="w-4 h-4 accent-neon-cyan mt-0.5"
                  />
                  <div>
                    <span className={`text-sm font-medium ${!!pendingModelChange ? 'text-neon-cyan' : 'text-gray-300'}`}>
                      Save and restart Gateway now
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Agent will be temporarily unavailable during restart
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-space-700">
                <NeonButton
                  variant="outline"
                  onClick={() => {
                    setShowModelWarning(false)
                    setPendingModelChange(null)
                    setTempModelSelection(null)
                    // Reset model selection to original
                    setFormData(prev => ({ ...prev, model: agent?.model || 'default' }))
                  }}
                >
                  Cancel
                </NeonButton>
                <NeonButton
                  variant="cyan"
                  onClick={() => {
                    const newModel = tempModelSelection || pendingModelChange
                    if (newModel && newModel !== formData.model) {
                      setFormData(prev => ({ ...prev, model: newModel }))
                      handleSave(!!pendingModelChange)
                    } else {
                      handleSave(false)
                    }
                    setTempModelSelection(null)
                  }}
                  loading={saving}
                >
                  Confirm
                </NeonButton>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in duration-200">
            <GlassCard variant="pink" className="p-6" hover={false}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-neon-red/10 border border-neon-red/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-neon-red" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Delete Agent</h2>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-2">
                Are you sure you want to delete <span className="text-white font-semibold">{agent.name}</span>?
              </p>
              <p className="text-neon-red/70 text-xs mb-6">
                This will remove the agent from the configuration. The workspace files will NOT be deleted.
              </p>

              <div className="flex justify-end gap-3">
                <NeonButton
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </NeonButton>
                <NeonButton
                  variant="pink"
                  onClick={handleDelete}
                >
                  Delete
                </NeonButton>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
