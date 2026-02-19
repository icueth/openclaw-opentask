'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CreateTaskRequest } from '@/types/task'
import TaskForm from '@/components/TaskForm'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  agentId: string
  workspace: string
}

export default function NewTaskPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch project to get agent info
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        const data = await res.json()
        if (data.success) {
          setProject(data.project)
        } else {
          setError('Project not found')
        }
      } catch (err) {
        setError('Failed to load project')
      } finally {
        setProjectLoading(false)
      }
    }
    fetchProject()
  }, [projectId])

  const handleSubmit = async (data: CreateTaskRequest) => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      const result = await res.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create task')
      }
      
      // Navigate to task detail or tasks list
      router.push(`/projects/${projectId}/tasks/${result.task.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/projects/${projectId}/tasks`)
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-space-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading project...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-space-black flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <p className="text-neon-red">Project not found</p>
          <Link href="/projects" className="text-neon-cyan hover:underline mt-4 block">
            Back to Projects
          </Link>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-space-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-space-black/80 backdrop-blur-xl border-b border-space-600/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left */}
            <div className="flex items-center gap-4">
              <Link 
                href={`/projects/${projectId}/tasks`}
                className="flex items-center gap-2 text-gray-400 hover:text-neon-cyan transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Tasks</span>
              </Link>
              <div className="h-6 w-px bg-space-600/50" />
              <div>
                <h1 className="text-xl font-bold text-gray-100">
                  Create New Task
                </h1>
                <p className="text-xs text-gray-500">
                  for {project.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <GlassCard className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-neon-cyan" />
              Task Details
            </h2>
            <p className="text-gray-500 mt-1">
              Create a new task for this project
            </p>
          </div>

          <TaskForm
            projectId={projectId}
            projectAgentId={project.agentId}
            projectAgentName={project.agentId}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
        </GlassCard>
      </main>
    </div>
  )
}