'use client'

import { useState } from 'react'
import GlassCard from './GlassCard'
import NeonButton from './NeonButton'
import { CreateAgentData } from '@/types/agent'
import { Bot, X, AlertCircle } from 'lucide-react'

const AVAILABLE_MODELS = [
  { id: 'default', name: 'Default (from config)' },
  { id: 'kimi-coding/kimi-for-coding', name: 'Kimi for Coding' },
  { id: 'kimi-coding/k2p5', name: 'Kimi K2.5' },
  { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
]

const EMOJI_OPTIONS = ['🤖', '🐱', '🎯', '✨', '🔥', '🚀', '💡', '🔧', '🎨', '📊', '🔍', '⚡', '🧠', '💻', '📱']

interface CreateAgentModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: CreateAgentData) => Promise<void>
}

export default function CreateAgentModal({ isOpen, onClose, onCreate }: CreateAgentModalProps) {
  const [formData, setFormData] = useState<CreateAgentData>({
    id: '',
    name: '',
    emoji: '🤖',
    model: 'default',
    description: ''
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  if (!isOpen) return null

  const validateId = (id: string): boolean => {
    // Only allow lowercase letters, numbers, and hyphens
    return /^[a-z0-9-]+$/.test(id)
  }

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setFormData(prev => ({ ...prev, id: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.id.trim()) {
      setError('Agent ID is required')
      return
    }

    if (!validateId(formData.id)) {
      setError('Agent ID can only contain lowercase letters, numbers, and hyphens')
      return
    }

    if (!formData.name.trim()) {
      setError('Agent Name is required')
      return
    }

    setCreating(true)
    try {
      await onCreate(formData)
      // Reset form
      setFormData({
        id: '',
        name: '',
        emoji: '🤖',
        model: 'default',
        description: ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-in fade-in zoom-in duration-200">
        <GlassCard variant="cyan" className="p-6" hover={false}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Create New Agent</h2>
                <p className="text-xs text-gray-500">Configure your AI companion</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-space-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-neon-red/10 border border-neon-red/30 rounded-lg flex items-center gap-2 text-neon-red text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Agent ID */}
            <div>
              <label className="block text-xs font-medium text-neon-cyan/70 uppercase tracking-wider font-mono mb-2">
                Agent ID <span className="text-neon-red">*</span>
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={handleIdChange}
                placeholder="e.g., researcher, designer"
                className="w-full px-4 py-3 bg-space-900/80 border border-space-600 rounded-lg text-white placeholder-gray-600 font-mono text-sm focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] focus:outline-none transition-all"
                disabled={creating}
              />
              <p className="mt-1 text-xs text-gray-500">Unique identifier, used for workspace folder</p>
            </div>

            {/* Agent Name */}
            <div>
              <label className="block text-xs font-medium text-neon-cyan/70 uppercase tracking-wider font-mono mb-2">
                Agent Name <span className="text-neon-red">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Research Bot"
                className="w-full px-4 py-3 bg-space-900/80 border border-space-600 rounded-lg text-white placeholder-gray-600 font-mono text-sm focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] focus:outline-none transition-all"
                disabled={creating}
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

            {/* Model Selection */}
            <div>
              <label className="block text-xs font-medium text-neon-cyan/70 uppercase tracking-wider font-mono mb-2">
                Model
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-4 py-3 bg-space-900/80 border border-space-600 rounded-lg text-white font-mono text-sm focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] focus:outline-none transition-all appearance-none cursor-pointer"
                disabled={creating}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                {AVAILABLE_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
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
                disabled={creating}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-neon-cyan/10">
              <NeonButton variant="outline" onClick={onClose} disabled={creating}>
                Cancel
              </NeonButton>
              <NeonButton
                variant="cyan"
                type="submit"
                loading={creating}
                disabled={!formData.id.trim() || !formData.name.trim()}
              >
                {creating ? 'Creating...' : 'Create Agent'}
              </NeonButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}
