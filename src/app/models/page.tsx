'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Cpu, Zap, Database, Check, RefreshCw } from 'lucide-react'

interface Model {
  id: string
  name: string
  provider: string
  contextWindow: number
  maxTokens: number
  reasoning: boolean
  isPrimary: boolean
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([])
  const [primaryModel, setPrimaryModel] = useState('')
  const [providers, setProviders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModels()
  }, [])

  async function fetchModels() {
    setLoading(true)
    try {
      const res = await fetch('/api/models-manage')
      const data = await res.json()
      setModels(data.models || [])
      setPrimaryModel(data.primaryModel || '')
      setProviders(data.providers || [])
    } catch (error) {
      console.error('Failed to fetch models:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group by provider
  const modelsByProvider = models.reduce((acc, model) => {
    const provider = model.provider || 'unknown'
    if (!acc[provider]) acc[provider] = []
    acc[provider].push(model)
    return acc
  }, {} as Record<string, Model[]>)

  const providerNames: Record<string, string> = {
    'zai': 'Zhipu AI (GLM)',
    'moonshot': 'Moonshot (Kimi)',
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
  }

  return (
    <DashboardLayout>
      <header className="sticky top-0 z-30 bg-dark-800/80 backdrop-blur-sm border-b border-dark-600 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Models</h1>
            <p className="text-sm text-gray-500">{models.length} models from {providers.length} providers</p>
          </div>
          <button onClick={fetchModels} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-dark-600 text-gray-300 rounded-lg hover:bg-dark-500">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(modelsByProvider).map(([provider, providerModels]) => (
              <div key={provider}>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-blue rounded-full" />
                  {providerNames[provider] || provider.toUpperCase()}
                  <span className="text-sm text-gray-500">({providerModels.length} models)</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providerModels.map((model) => (
                    <div key={model.id}
                      className={`relative p-6 rounded-xl border transition-colors ${
                        model.isPrimary 
                          ? 'bg-accent-blue/10 border-accent-blue/50' 
                          : 'bg-dark-700 border-dark-600 hover:border-dark-500'
                      }`}>
                      {model.isPrimary && (
                        <div className="absolute top-3 right-3">
                          <span className="flex items-center gap-1 px-2 py-1 bg-accent-blue text-white text-xs rounded">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <h3 className="font-semibold text-white text-lg">{model.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{model.id}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Database className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-400">Context:</span>
                          <span className="text-gray-300">{formatNumber(model.contextWindow)} tokens</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          <Zap className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-400">Max Output:</span>
                          <span className="text-gray-300">{formatNumber(model.maxTokens)} tokens</span>
                        </div>
                        
                        {model.reasoning && (
                          <div className="flex items-center gap-3 text-sm">
                            <Cpu className="w-4 h-4 text-accent-purple" />
                            <span className="text-accent-purple">Reasoning capable</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {models.length === 0 && (
              <div className="text-center py-20">
                <Cpu className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">No models configured</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
