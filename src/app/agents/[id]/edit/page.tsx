'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft, Save, AlertCircle, Trash2 } from 'lucide-react'

interface Model {
  id: string
  name: string
  provider: string
}

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string
  
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [form, setForm] = useState({
    name: '',
    model: '',
    thinking: 'off',
    skills: '',
    identityName: '',
    identityEmoji: '',
  })

  useEffect(() => {
    Promise.all([fetchAgent(), fetchModels()])
  }, [agentId])

  async function fetchAgent() {
    try {
      const res = await fetch(`/api/agents/${agentId}`)
      const data = await res.json()
      
      setForm({
        name: data.name || data.identity?.name || '',
        model: data.model || '',
        thinking: data.thinking || 'off',
        skills: data.skills?.join(', ') || '',
        identityName: data.identity?.name || '',
        identityEmoji: data.identity?.emoji || '',
      })
    } catch (error) {
      setMessage({ type: 'error', text: 'Agent not found' })
    }
  }

  async function fetchModels() {
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      setModels(data.models || [])
    } catch (error) {
      console.error('Failed to fetch models:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          model: form.model,
          thinking: form.thinking,
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
          identity: { name: form.identityName || form.name, emoji: form.identityEmoji }
        })
      })

      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Agent updated!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete agent "${agentId}"?`)) return
    
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        router.push('/agents')
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <header className="sticky top-0 z-30 bg-dark-800/80 backdrop-blur-sm border-b border-dark-600 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-dark-600 rounded-lg hover:bg-dark-500">
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Agent</h1>
              <p className="text-sm text-gray-500 font-mono">{agentId}</p>
            </div>
          </div>
          
          {agentId !== 'main' && (
            <button onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-accent-red/20 text-accent-red rounded-lg hover:bg-accent-red/30">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </header>

      <div className="p-8 max-w-2xl">
        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${
            message.type === 'success' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'
          }`}>
            <AlertCircle className="w-5 h-5" />
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Display Name</label>
            <input type="text" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-dark-600 border border-dark-500 rounded-lg text-white focus:border-accent-blue focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Model</label>
            <select value={form.model}
              onChange={e => setForm({ ...form, model: e.target.value })}
              className="w-full px-4 py-3 bg-dark-600 border border-dark-500 rounded-lg text-white focus:border-accent-blue focus:outline-none">
              <option value="">Select a model</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Thinking Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {['off', 'low', 'medium', 'high'].map(level => (
                <button key={level} type="button"
                  onClick={() => setForm({ ...form, thinking: level })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.thinking === level ? 'bg-accent-blue text-white' : 'bg-dark-600 text-gray-400 hover:text-gray-300'
                  }`}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Skills (comma-separated)</label>
            <input type="text" value={form.skills}
              onChange={e => setForm({ ...form, skills: e.target.value })}
              className="w-full px-4 py-3 bg-dark-600 border border-dark-500 rounded-lg text-white focus:border-accent-blue focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Identity Name</label>
              <input type="text" value={form.identityName}
                onChange={e => setForm({ ...form, identityName: e.target.value })}
                className="w-full px-4 py-3 bg-dark-600 border border-dark-500 rounded-lg text-white focus:border-accent-blue focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Emoji</label>
              <input type="text" value={form.identityEmoji}
                onChange={e => setForm({ ...form, identityEmoji: e.target.value })}
                className="w-full px-4 py-3 bg-dark-600 border border-dark-500 rounded-lg text-white focus:border-accent-blue focus:outline-none text-2xl" />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/80 disabled:opacity-50">
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
