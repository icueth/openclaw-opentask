'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import HolographicText from '@/components/HolographicText'
import { Cpu, Sparkles, ArrowLeft, Bot, Terminal } from 'lucide-react'

const AVAILABLE_MODELS = [
  { id: 'kimi-coding/kimi-for-coding', name: 'Kimi Coding', icon: '🔥' },
  { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet', icon: '🎯' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus', icon: '🧠' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', icon: '⚡' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini Pro', icon: '🔮' },
]

export default function NewAgentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedModel, setSelectedModel] = useState('kimi-coding/kimi-for-coding')
  const [agentName, setAgentName] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!agentName.trim()) return
    
    setCreating(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: agentName,
          model: selectedModel 
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        router.push('/agents')
      }
    } catch (error) {
      console.error('Failed to create agent:', error)
    } finally {
      setCreating(false)
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
            <button 
              onClick={() => router.push('/agents')}
              className="p-2 rounded-xl bg-space-700 border border-space-600 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <HolographicText size="xl" variant="multi">Spawn Agent</HolographicText>
              <p className="text-sm text-gray-500 font-mono">Create a new AI agent instance</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto">
        {/* Model Selection */}
        <GlassCard variant="cyan" className="p-6 mb-6" cornerAccent={true}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <h2 className="font-semibold text-white font-mono">Select Model</h2>
              <p className="text-sm text-gray-500">Choose the AI model for your agent</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`
                  p-4 rounded-xl border text-left transition-all duration-300
                  ${selectedModel === model.id
                    ? 'bg-neon-cyan/10 border-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                    : 'bg-space-800/50 border-space-600 hover:border-neon-cyan/30'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{model.icon}</span>
                  <div>
                    <p className={`font-medium font-mono ${selectedModel === model.id ? 'text-neon-cyan' : 'text-white'}`}>
                      {model.name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono truncate">{model.id}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Agent Configuration */}
        <GlassCard className="p-6 mb-6" hover={false}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-neon-purple" />
            </div>
            <div>
              <h2 className="font-semibold text-white font-mono">Agent Configuration</h2>
              <p className="text-sm text-gray-500">Set up your agent parameters</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neon-cyan/70 uppercase tracking-wider font-mono mb-2">
                Agent Name
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g., My Assistant"
                className="w-full px-4 py-3 bg-space-900/80 border border-space-600 rounded-lg text-white placeholder-gray-600 font-mono focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] focus:outline-none transition-all"
              />
            </div>
          </div>
        </GlassCard>

        {/* Preview */}
        <GlassCard variant="purple" className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-neon-purple" />
            </div>
            <div>
              <h2 className="font-semibold text-white font-mono">Preview</h2>
            </div>
          </div>

          <div className="bg-space-900/80 rounded-lg p-4 font-mono text-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <span className="text-neon-green">$</span>
              <span>openclaw spawn</span>
            </div>
            <div className="text-gray-300 space-y-1">
              <p><span className="text-neon-cyan">model:</span> {selectedModel}</p>
              <p><span className="text-neon-cyan">name:</span> {agentName || '<not set>'}</p>
            </div>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <NeonButton variant="outline" onClick={() => router.push('/agents')}>
            Cancel
          </NeonButton>
          <NeonButton 
            variant="cyan" 
            onClick={handleCreate}
            loading={creating}
            disabled={!agentName.trim()}
            icon={<Sparkles className="w-4 h-4" />}
          >
            {creating ? 'Spawning...' : 'Spawn Agent'}
          </NeonButton>
        </div>
      </div>
    </DashboardLayout>
  )
}
