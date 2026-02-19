'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import HolographicText from '@/components/HolographicText'
import TaskForm from '@/components/TaskForm'
import TaskBoard from '@/components/TaskBoard'
import ProjectMemory from '@/components/ProjectMemory'
import RecentMemoryActivity from '@/components/RecentMemoryActivity'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import {
  ArrowLeft, FolderOpen, FileText, Edit2, Save, X,
  AlertCircle, Clock, Plus, CheckCircle, RefreshCw,
  Trash2, AlertTriangle, Cpu, Download, GitBranch
} from 'lucide-react'
import Link from 'next/link'

interface FileItem {
  name: string
  content?: string
  preview?: string
}

interface ProjectDetail {
  id: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
  files?: FileItem[]
  path?: string
  workspace?: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const { deleteProject, updateProject } = useProjects()
  const { tasks, loading: tasksLoading, refetch: refetchTasks, createTask } = useTasks({ projectId, pollInterval: 5000 })

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [memoryContent, setMemoryContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'summary' | 'memory'>('overview')
  const [summaryContent, setSummaryContent] = useState<string>('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Git Pull state
  const [showPullDialog, setShowPullDialog] = useState(false)
  const [branches, setBranches] = useState<string[]>(['main', 'master'])
  const [selectedBranch, setSelectedBranch] = useState('main')
  const [pullLoading, setPullLoading] = useState(false)
  const [hasGitHub, setHasGitHub] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch project details
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      
      if (data.success) {
        setProject(data.project)
        setEditName(data.project.name)
        setEditDescription(data.project.description || '')
        
        // Fetch MEMORY.md content
        try {
          const memoryRes = await fetch(`/api/projects/${projectId}/memory`)
          const memoryData = await memoryRes.json()
          if (memoryData.success && memoryData.content) {
            setMemoryContent(memoryData.content)
          }
        } catch (e) {
          console.log('No memory file yet')
        }
        
        // Fetch PROJECT_SUMMARY.md content
        try {
          const summaryRes = await fetch(`/api/projects/${projectId}/files/PROJECT_SUMMARY.md`)
          const summaryData = await summaryRes.json()
          if (summaryData.success && summaryData.content) {
            setSummaryContent(summaryData.content)
          }
        } catch (e) {
          console.log('No summary file yet')
        }
        
        // Check if project has GitHub
        setHasGitHub(!!data.project.githubUrl)
      } else {
        setError(data.error || 'Failed to load project')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editName.trim()) {
      setMessage({ type: 'error', text: 'Project name is required' })
      return
    }
    
    setSaving(true)
    const success = await updateProject(projectId, {
      name: editName.trim(),
      description: editDescription.trim()
    })
    setSaving(false)
    
    if (success) {
      setProject(prev => prev ? { ...prev, name: editName, description: editDescription } : null)
      setEditing(false)
      setMessage({ type: 'success', text: 'Project updated successfully' })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: 'Failed to update project' })
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${project?.name}"? This will move it to trash.`)) return
    
    const success = await deleteProject(projectId)
    if (success) {
      router.push('/projects')
    } else {
      setMessage({ type: 'error', text: 'Failed to delete project' })
    }
  }

  const handleCreateTask = async (data: any) => {
    const task = await createTask(data)
    if (task) {
      setShowTaskForm(false)
      setMessage({ type: 'success', text: 'Task created successfully' })
      setActiveTab('tasks')
      setTimeout(() => setMessage(null), 3000)
      return Promise.resolve()
    }
    return Promise.reject(new Error('Failed to create task'))
  }

  // Fetch available branches for pull
  const fetchBranches = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/git-pull`)
      const data = await res.json()
      if (data.success && data.branches) {
        setBranches(data.branches)
        setSelectedBranch(data.current || 'main')
      }
    } catch (e) {
      console.log('Could not fetch branches, using defaults')
    }
  }

  // Open pull dialog
  const openPullDialog = async () => {
    await fetchBranches()
    setShowPullDialog(true)
  }

  // Handle git pull
  const handlePull = async () => {
    setPullLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/git-pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: selectedBranch })
      })
      const data = await res.json()
      
      if (data.success) {
        setShowPullDialog(false)
        setMessage({ type: 'success', text: `Pull task created for branch: ${selectedBranch}` })
        setActiveTab('tasks')
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create pull task' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create pull task' })
    } finally {
      setPullLoading(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const processing = tasks.filter(t => t.status === 'processing').length
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'created').length
    const failed = tasks.filter(t => t.status === 'failed').length
    return { total, completed, processing, pending, failed }
  }

  const stats = getTaskStats()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <GlassCard variant="pink" className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-neon-red mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Project</h2>
            <p className="text-gray-400 mb-6">{error || 'Project not found'}</p>
            <Link href="/projects">
              <NeonButton variant="cyan" icon={<ArrowLeft className="w-4 h-4" />}>
                Back to Projects
              </NeonButton>
            </Link>
          </GlassCard>
        </div>
      </DashboardLayout>
    )
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
            <Link 
              href="/projects"
              className="p-2 text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-neon-cyan" />
              </div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-3 py-1.5 bg-space-800/50 border border-neon-cyan/30 rounded-lg
                      text-white font-semibold
                      focus:border-neon-cyan focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-1.5 text-neon-green hover:bg-neon-green/10 rounded-lg"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditName(project.name)
                      setEditDescription(project.description || '')
                    }}
                    className="p-1.5 text-neon-red hover:bg-neon-red/10 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white">{project.name}</h1>
                    <button
                      onClick={() => setEditing(true)}
                      className="p-1 text-gray-500 hover:text-neon-cyan opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">ID: {projectId}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasGitHub && (
              <NeonButton
                variant="purple"
                onClick={openPullDialog}
                icon={<Download className="w-4 h-4" />}
              >
                Pull
              </NeonButton>
            )}
            <button
              onClick={handleDelete}
              className="p-2 text-gray-500 hover:text-neon-red hover:bg-neon-red/10 rounded-lg transition-all"
              title="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <Link href={`/projects/${projectId}/pipeline-tasks/new`}>
              <NeonButton
                variant="purple"
                icon={<GitBranch className="w-4 h-4" />}
              >
                Pipeline
              </NeonButton>
            </Link>
            <NeonButton
              variant="cyan"
              onClick={() => setShowTaskForm(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              New Task
            </NeonButton>
          </div>
        </div>
      </header>

      <div className="p-8">
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
            <button onClick={() => setMessage(null)} className="ml-auto text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </GlassCard>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-space-600/50">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'tasks', label: 'Tasks', icon: CheckCircle, count: stats.total },
            { id: 'summary', label: 'Summary', icon: FileText },
            { id: 'memory', label: 'Memory', icon: FolderOpen }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all relative
                ${activeTab === tab.id
                  ? 'text-neon-cyan'
                  : 'text-gray-400 hover:text-gray-200'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 bg-space-700 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neon-cyan to-neon-purple" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Memory Activity */}
            <RecentMemoryActivity projectId={projectId} />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="p-4" hover={false}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white font-mono">{stats.total}</p>
                    <p className="text-xs text-gray-500 font-mono uppercase">Total Tasks</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard className="p-4" hover={false}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white font-mono">{stats.completed}</p>
                    <p className="text-xs text-gray-500 font-mono uppercase">Completed</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard className="p-4" hover={false}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-neon-purple animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white font-mono">{stats.processing}</p>
                    <p className="text-xs text-gray-500 font-mono uppercase">Processing</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard className="p-4" hover={false}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon-red/10 border border-neon-red/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-neon-red" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white font-mono">{stats.failed}</p>
                    <p className="text-xs text-gray-500 font-mono uppercase">Failed</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Description */}
            {editing ? (
              <GlassCard className="p-6" cornerAccent>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-space-800/50 border border-space-600/50 rounded-xl
                    text-gray-200 resize-none
                    focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30
                    transition-all"
                />
              </GlassCard>
            ) : project.description ? (
              <GlassCard className="p-6" cornerAccent>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                <p className="text-gray-300">{project.description}</p>
              </GlassCard>
            ) : null}

            {/* Meta Info */}
            <GlassCard className="p-6" hover={false}>
              <h3 className="text-sm font-medium text-gray-400 mb-4">Project Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-300">{formatDate(project.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>
                  <span className="ml-2 text-gray-300">{formatDate(project.updatedAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>
                  <code className="ml-2 text-neon-cyan/70 font-mono text-xs">
                    {(project.path || project.workspace)?.replace(/^.*?\.openclaw\/workspace.*?\/dashboard\//, '')}
                  </code>
                </div>
              </div>
            </GlassCard>

            {/* Files */}
            {project.files && project.files.length > 0 && (
              <GlassCard className="p-6" hover={false}>
                <h3 className="text-sm font-medium text-gray-400 mb-4">Files</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {project.files.map((file: FileItem) => (
                    <div 
                      key={file.name}
                      className="flex items-center gap-3 p-3 bg-space-800/50 rounded-lg border border-space-600/30"
                    >
                      <FileText className="w-4 h-4 text-neon-cyan" />
                      <span className="text-sm text-gray-300 font-mono">{file.name}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Project Tasks</h2>
              <NeonButton
                variant="outline"
                onClick={refetchTasks}
                icon={<RefreshCw className={`w-4 h-4 ${tasksLoading ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </NeonButton>
            </div>
            <TaskBoard 
              tasks={tasks} 
              loading={tasksLoading} 
              projectId={projectId}
              onRefresh={refetchTasks}
              onStartTask={async (taskId) => {
                try {
                  const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/start`, { method: 'POST' })
                  const data = await res.json()
                  if (data.success) {
                    setMessage({ type: 'success', text: 'Task started' })
                    refetchTasks()
                  } else {
                    setMessage({ type: 'error', text: data.error || 'Failed to start task' })
                  }
                } catch (err: any) {
                  setMessage({ type: 'error', text: err.message || 'Failed to start task' })
                }
              }}
              onRetryTask={async (taskId) => {
                try {
                  const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/start`, { method: 'POST' })
                  const data = await res.json()
                  if (data.success) {
                    setMessage({ type: 'success', text: 'Task retrying' })
                    refetchTasks()
                  } else {
                    setMessage({ type: 'error', text: data.error || 'Failed to retry task' })
                  }
                } catch (err: any) {
                  setMessage({ type: 'error', text: err.message || 'Failed to retry task' })
                }
              }}
              onDeleteTask={async (taskId) => {
                if (!confirm('Delete this task?')) return
                try {
                  const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' })
                  const data = await res.json()
                  if (data.success) {
                    setMessage({ type: 'success', text: 'Task deleted' })
                    refetchTasks()
                  } else {
                    setMessage({ type: 'error', text: data.error || 'Failed to delete task' })
                  }
                } catch (err: any) {
                  setMessage({ type: 'error', text: err.message || 'Failed to delete task' })
                }
              }}
            />
          </div>
        )}

        {activeTab === 'summary' && (
          <GlassCard variant="cyan" className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neon-cyan/10 bg-gradient-to-r from-neon-cyan/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-neon-cyan" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-neon-cyan font-semibold">PROJECT_SUMMARY.md</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan/70 font-mono">DOC</span>
                  </div>
                  <span className="text-xs text-gray-500">Project Overview & Documentation</span>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="min-h-[300px] max-h-[500px] overflow-auto p-5">
              {summaryContent ? (
                <div className="prose prose-invert max-w-none">
                  <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{summaryContent}</pre>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-mono text-sm">No summary file found</p>
                  <p className="text-xs text-gray-500 mt-1">Complete an init task to generate PROJECT_SUMMARY.md</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-5 py-2 border-t border-neon-cyan/10 bg-space-900/30 flex items-center justify-between text-[10px] text-gray-600 font-mono">
              <span>Markdown</span>
              <span>{summaryContent.length} chars</span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                DOC
              </span>
            </div>
          </GlassCard>
        )}

        {activeTab === 'memory' && (
          <ProjectMemory projectId={projectId} initialContent={memoryContent} />
        )}
      </div>

      {/* Pull Dialog */}
      {showPullDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <GlassCard variant="purple" className="p-6" cornerAccent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-neon-purple" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Pull from GitHub</h2>
                    <p className="text-xs text-gray-500">Select branch to pull</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPullDialog(false)}
                  className="p-2 text-gray-400 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Branch
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-4 py-3 bg-space-800/50 border border-neon-purple/30 rounded-xl
                      text-white
                      focus:border-neon-purple focus:outline-none focus:ring-2 focus:ring-neon-purple/20"
                  >
                    {branches.map((branch) => (
                      <option key={branch} value={branch} className="bg-space-800">
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPullDialog(false)}
                    className="flex-1 px-4 py-3 text-gray-400 hover:text-white hover:bg-space-700/50 
                      rounded-xl transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePull}
                    disabled={pullLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-neon-purple to-neon-pink 
                      text-white rounded-xl font-medium
                      hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all flex items-center justify-center gap-2"
                  >
                    {pullLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Pull {selectedBranch}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col">
            <GlassCard variant="cyan" className="p-6 overflow-y-auto" cornerAccent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <HolographicText size="lg">Create New Task</HolographicText>
                </div>
                <button
                  onClick={() => setShowTaskForm(false)}
                  className="p-2 text-gray-400 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <TaskForm
                projectId={projectId}
                onSubmit={handleCreateTask}
                onCancel={() => setShowTaskForm(false)}
              />
            </GlassCard>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}