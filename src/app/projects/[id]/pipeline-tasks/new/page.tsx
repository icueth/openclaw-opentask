'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import HolographicText from '@/components/HolographicText'
import PipelineTaskForm from '@/components/PipelineTaskForm'
import { 
  ArrowLeft, GitBranch, AlertCircle, CheckCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function NewPipelineTaskPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      if (data.success) {
        setProject(data.project)
      } else {
        setError(data.error || 'Project not found')
      }
    } catch (e) {
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePipeline = async (data: any) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create pipeline task')
      }
      
      setMessage({ type: 'success', text: `Pipeline "${data.title}" created with ${result.pipeline.steps.length} steps!` })
      
      // Redirect to tasks page after a delay
      setTimeout(() => {
        router.push(`/projects/${projectId}?tab=tasks`)
      }, 2000)
      
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
      throw err
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <GlassCard variant="pink" className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-neon-red mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Error</h2>
            <p className="text-gray-400">{error}</p>
          </GlassCard>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-space-800/80 backdrop-blur-xl border-b border-neon-cyan/10 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/projects/${projectId}`}
              className="p-2 text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-neon-purple" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">New Pipeline Task</h1>
                <p className="text-xs text-gray-500">Multi-agent workflow for {project?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-3xl mx-auto">
        {/* Message */}
        {message && (
          <GlassCard 
            variant={message.type === 'success' ? 'cyan' : 'pink'}
            className="mb-6 p-4 flex items-center gap-3 animate-fade-in"
            hover={false}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-neon-green" />
            ) : (
              <AlertCircle className="w-5 h-5 text-neon-red" />
            )}
            <span className={`font-mono text-sm ${message.type === 'success' ? 'text-neon-green' : 'text-neon-red'}`}>
              {message.text}
            </span>
          </GlassCard>
        )}

        {/* Info Card */}
        <GlassCard variant="purple" className="mb-6 p-4" hover={false}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center flex-shrink-0">
              <GitBranch className="w-4 h-4 text-neon-purple" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-200 mb-1">What is a Pipeline Task?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                A pipeline task coordinates multiple AI agents working together in sequence. 
                Each step can spawn multiple agents that work in parallel and communicate through a shared context file.
                Perfect for complex tasks like software development, content creation, or data analysis.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Pipeline Form */}
        <GlassCard className="p-6" cornerAccent>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-neon-cyan" />
            </div>
            <HolographicText size="lg">Create Pipeline</HolographicText>
          </div>
          
          <PipelineTaskForm
            projectId={projectId}
            onSubmit={handleCreatePipeline}
            onCancel={() => router.push(`/projects/${projectId}`)}
          />
        </GlassCard>
      </div>
    </DashboardLayout>
  )
}