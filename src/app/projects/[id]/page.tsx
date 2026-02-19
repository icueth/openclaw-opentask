'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import { FolderKanban, ArrowLeft, Edit3, Trash2, FileText } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  path: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Project not found')
          } else {
            setError('Failed to load project')
          }
          setLoading(false)
          return
        }
        const data = await res.json()
        setProject(data)
      } catch (err) {
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProject()
  }, [projectId])

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this project?')) return
    
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/projects')
      }
    } catch (err) {
      console.error('Failed to delete project:', err)
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

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <GlassCard className="p-12 text-center">
            <p className="text-neon-pink text-lg">{error || 'Project not found'}</p>
            <NeonButton
              variant="outline"
              onClick={() => router.push('/projects')}
              className="mt-4"
            >
              Back to Projects
            </NeonButton>
          </GlassCard>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <header className="sticky top-0 z-30 bg-space-800/80 backdrop-blur-xl border-b border-neon-cyan/10 px-8 py-4">
        <div className="flex items-center justify-between">
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
              <div>
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <span className={`text-xs font-mono ${
                  project.status === 'active' ? 'text-neon-green' :
                  project.status === 'completed' ? 'text-neon-purple' :
                  'text-gray-400'
                }`}>
                  {project.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NeonButton
              variant="outline"
              onClick={handleDelete}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </NeonButton>
            <NeonButton
              variant="cyan"
              onClick={() => router.push(`/projects/${projectId}/edit`)}
              icon={<Edit3 className="w-4 h-4" />}
            >
              Edit
            </NeonButton>
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
              <p className="text-gray-400">
                {project.description || 'No description provided.'}
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-neon-cyan" />
                Files
              </h2>
              <div className="space-y-2">
                <div
                  className="flex items-center gap-3 p-3 rounded-lg bg-space-900/50 hover:bg-space-700 cursor-pointer transition-colors"
                  onClick={() => router.push(`/workspace?project=${projectId}`)}
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">PROJECT.md</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Project Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <p className="text-gray-300">{new Date(project.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>
                  <p className="text-gray-300">{new Date(project.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
