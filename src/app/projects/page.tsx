'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import { FolderKanban, Plus, RefreshCw, Trash2, Edit3 } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: string
  createdAt: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this project?')) return
    
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchProjects()
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  function handleRefresh() {
    setRefreshing(true)
    fetchProjects()
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Projects</h1>
              <p className="text-sm text-gray-500 mt-1 font-mono">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NeonButton
              variant="outline"
              onClick={handleRefresh}
              icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </NeonButton>
            <NeonButton
              variant="cyan"
              onClick={() => router.push('/projects/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              New Project
            </NeonButton>
          </div>
        </div>
      </header>

      <div className="p-8">
        {projects.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <FolderKanban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No projects yet</p>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              Create your first project to get started
            </p>
            <NeonButton
              variant="cyan"
              onClick={() => router.push('/projects/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Project
            </NeonButton>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project) => (
              <GlassCard
                key={project.id}
                className="p-6 cursor-pointer hover:border-neon-cyan/50 transition-all"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                    <FolderKanban className="w-6 h-6 text-neon-cyan" />
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-mono ${
                    project.status === 'active' ? 'bg-neon-green/20 text-neon-green' :
                    project.status === 'completed' ? 'bg-neon-purple/20 text-neon-purple' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {project.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                  {project.description || 'No description'}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/projects/${project.id}/edit`)
                      }}
                      className="p-2 rounded-lg hover:bg-neon-cyan/10 text-gray-400 hover:text-neon-cyan transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(project.id)
                      }}
                      className="p-2 rounded-lg hover:bg-neon-pink/10 text-gray-400 hover:text-neon-pink transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
