'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Task } from '@/types/task'
import TaskBoard from '@/components/TaskBoard'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import { 
  ArrowLeft, Plus, RefreshCw, LayoutGrid 
} from 'lucide-react'
import Link from 'next/link'

export default function TasksPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string>(projectId)

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`)
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch tasks')
      }
      
      setTasks(data.tasks || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Fetch project info
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.project?.name) {
            setProjectName(data.project.name)
          }
        }
      } catch (err) {
        console.error('Failed to fetch project:', err)
      }
    }
    fetchProject()
  }, [projectId])

  // Initial load
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Start task
  const handleStartTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/start`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start task')
      }
      
      // Refresh tasks
      fetchTasks()
    } catch (err: any) {
      alert(`Failed to start task: ${err.message}`)
    }
  }

  // Retry task (start a failed task again)
  const handleRetryTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/start`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to retry task')
      }
      
      // Refresh tasks
      fetchTasks()
    } catch (err: any) {
      alert(`Failed to retry task: ${err.message}`)
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }
    
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete task')
      }
      
      // Refresh tasks
      fetchTasks()
    } catch (err: any) {
      alert(`Failed to delete task: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-space-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-space-black/80 backdrop-blur-xl border-b border-space-600/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left */}
            <div className="flex items-center gap-4">
              <Link 
                href={`/projects/${projectId}`}
                className="flex items-center gap-2 text-gray-400 hover:text-neon-cyan transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Project</span>
              </Link>
              <div className="h-6 w-px bg-space-600/50" />
              <div>
                <h1 className="text-xl font-bold text-gray-100">
                  Tasks
                </h1>
                <p className="text-sm text-gray-500">{projectName}</p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <Link href={`/projects/${projectId}/tasks/new`}>
                <NeonButton size="sm" icon={<Plus className="w-4 h-4" />}>
                  New Task
                </NeonButton>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error ? (
          <GlassCard className="p-8 text-center">
            <div className="text-neon-red mb-4">
              <RefreshCw className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">Error Loading Tasks</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <NeonButton onClick={fetchTasks} variant="cyan">
              Try Again
            </NeonButton>
          </GlassCard>
        ) : (
          <TaskBoard
            projectId={projectId}
            tasks={tasks}
            loading={loading}
            onRefresh={fetchTasks}
            onStartTask={handleStartTask}
            onRetryTask={handleRetryTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </main>
    </div>
  )
}
