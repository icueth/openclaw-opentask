'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import { FolderKanban, ArrowLeft } from 'lucide-react'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Project name is required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create project')
      }
      
      const project = await res.json()
      router.push(`/projects/${project.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <header className="sticky top-0 z-30 bg-space-800/80 backdrop-blur-xl border-b border-neon-cyan/10 px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/projects')}
            className="p-2 rounded-lg hover:bg-space-700 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-neon-cyan" />
            </div>
            <h1 className="text-2xl font-bold text-white">New Project</h1>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-2xl mx-auto">
        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-neon-pink/10 border border-neon-pink/30 text-neon-pink">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Project"
                className="w-full px-4 py-3 rounded-xl bg-space-900 border border-space-700 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your project..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-space-900 border border-space-700 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition-colors resize-none"
              />
            </div>
            
            <div className="flex items-center justify-end gap-4 pt-4">
              <NeonButton
                variant="outline"
                onClick={() => router.push('/projects')}
                type="button"
              >
                Cancel
              </NeonButton>
              <NeonButton
                variant="cyan"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </NeonButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </DashboardLayout>
  )
}
