'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import NeonBadge from '@/components/NeonBadge'
import HolographicText from '@/components/HolographicText'
import { 
  FolderOpen, RefreshCw, Plus, Trash2, ChevronRight, Users, 
  Cpu, Clock, Database, Zap, ArrowRight, Sparkles
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  agentId?: string
  agents?: string[]
  createdAt?: string
  fileCount?: number
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      
      // Enrich project data with file counts
      const enrichedProjects = await Promise.all(
        (data.projects || []).map(async (project: Project) => {
          try {
            const filesRes = await fetch(`/api/projects/${project.id}/files`)
            const filesData = await filesRes.json()
            return { ...project, fileCount: filesData.files?.length || 0 }
          } catch {
            return { ...project, fileCount: 0 }
          }
        })
      )
      
      setProjects(enrichedProjects)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchProjects()
  }

  async function deleteProject(projectId: string) {
    if (!confirm(`Delete project "${projectId}"?`)) return
    
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        fetchProjects()
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  function navigateToProject(projectId: string) {
    router.push(`/projects/${projectId}`)
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
              <Database className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <HolographicText size="xl" variant="multi">Projects</HolographicText>
              <p className="text-sm text-gray-500 font-mono">
                {projects.length} projects // {projects.reduce((acc, p) => acc + (p.fileCount || 0), 0)} files
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <NeonButton 
              variant="outline" 
              onClick={handleRefresh}
              icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </NeonButton>
            <Link href="/projects/new">
              <NeonButton 
                variant="cyan" 
                icon={<Plus className="w-4 h-4" />}
              >
                New Project
              </NeonButton>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <GlassCard className="p-4 flex items-center gap-3" hover={false}>
            <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">{projects.length}</p>
              <p className="text-xs text-gray-500 font-mono uppercase">Total Projects</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-3" hover={false}>
            <div className="w-10 h-10 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-neon-purple" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">
                {projects.reduce((acc, p) => acc + (p.fileCount || 0), 0)}
              </p>
              <p className="text-xs text-gray-500 font-mono uppercase">Total Files</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-3" hover={false}>
            <div className="w-10 h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">
                {new Set(projects.flatMap(p => p.agents || [])).size}
              </p>
              <p className="text-xs text-gray-500 font-mono uppercase">Active Agents</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-3" hover={false}>
            <div className="w-10 h-10 rounded-lg bg-neon-yellow/10 border border-neon-yellow/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-neon-yellow" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">
                {projects.filter(p => (p.agents?.length || 0) > 0).length}
              </p>
              <p className="text-xs text-gray-500 font-mono uppercase">With Agents</p>
            </div>
          </GlassCard>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <GlassCard key={i} className="h-48 animate-pulse" hover={false}>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-space-600" />
                    <div className="space-y-2">
                      <div className="w-32 h-5 rounded bg-space-600" />
                      <div className="w-20 h-3 rounded bg-space-600" />
                    </div>
                  </div>
                  <div className="w-full h-12 rounded bg-space-600" />
                  <div className="flex gap-2">
                    <div className="w-16 h-6 rounded-full bg-space-600" />
                    <div className="w-20 h-6 rounded-full bg-space-600" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <GlassCard className="py-16 text-center" hover={false}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/20 flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-neon-cyan/50" />
            </div>
            <h3 className="text-lg font-medium text-gray-400 font-mono mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to get started</p>
            <Link href="/projects/new">
              <NeonButton 
                variant="cyan" 
                icon={<Plus className="w-4 h-4" />}
              >
                Create Project
              </NeonButton>
            </Link>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <GlassCard
                key={project.id}
                variant="default"
                className="group cursor-pointer relative overflow-hidden"
                hover={true}
                cornerAccent={true}
                onClick={() => navigateToProject(project.id)}
              >
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/20 flex items-center justify-center group-hover:border-neon-cyan/40 transition-colors">
                        <FolderOpen className="w-6 h-6 text-neon-cyan" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white font-mono group-hover:text-neon-cyan transition-colors">{project.name}</h3>
                        <p className="text-xs text-gray-500 font-mono">ID: {project.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                      className="p-2 text-gray-500 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Description */}
                  {project.description ? (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>
                  ) : (
                    <p className="text-sm text-gray-600 mb-4 italic">No description</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 mb-4">
                    <NeonBadge variant="cyan" size="sm" icon={<Database className="w-3 h-3" />}>
                      {project.fileCount || 0} files
                    </NeonBadge>
                    {project.agentId && (
                      <NeonBadge variant="green" size="sm" icon={<Cpu className="w-3 h-3" />}>
                        {project.agentId}
                      </NeonBadge>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-space-600/30">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono">{project.createdAt || 'Recently'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-neon-cyan text-sm font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      Open
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
            
            {/* Add New Card */}
            <Link
              href="/projects/new"
              className="group h-full min-h-[200px] rounded-xl border-2 border-dashed border-space-600 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all duration-300 flex flex-col items-center justify-center gap-3"
            >
              <div className="w-14 h-14 rounded-xl bg-space-700 group-hover:bg-neon-cyan/10 flex items-center justify-center transition-colors">
                <Sparkles className="w-7 h-7 text-gray-500 group-hover:text-neon-cyan transition-colors" />
              </div>
              <span className="text-gray-500 group-hover:text-neon-cyan font-mono transition-colors">Create New Project</span>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
