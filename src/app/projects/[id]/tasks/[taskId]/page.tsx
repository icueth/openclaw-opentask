'use client'

// Disable static generation for this dynamic route
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Task } from '@/types/task'
import TaskStatusBadge, { TaskPriorityBadge } from '@/components/TaskStatusBadge'
import TaskResultViewer from '@/components/TaskResultViewer'
import TaskProgress from '@/components/TaskProgress'
import TaskLogViewer from '@/components/TaskLogViewer'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import { useProgressPolling } from '@/hooks/useProgressPolling'
import { 
  ArrowLeft, Play, RotateCcw, XCircle, Trash2, RefreshCw,
  Clock, User, Calendar, Terminal, Loader2, Wrench, AlertTriangle,
  CheckCircle, XOctagon, Activity, ChevronDown, GitBranch, FileCode, Rocket,
  BookOpen
} from 'lucide-react'
// Git push functionality - show for completed tasks with artifacts
const shouldShowGitPushButton = (task?: Task) => {
  if (!task) return false
  return (task.status === 'completed' || task.status === 'failed') && 
         task.artifacts && task.artifacts.length > 0
}
const getArtifactFileList = (task?: Task) => {
  if (!task?.artifacts) return []
  return task.artifacts
}
import Link from 'next/link'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const taskId = params.taskId as string
  
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [fixMenuOpen, setFixMenuOpen] = useState(false)
  const [fixStatus, setFixStatus] = useState<any>(null)
  const [fixLoading, setFixLoading] = useState(false)
  const [fixModalOpen, setFixModalOpen] = useState(false)
  const [fixAction, setFixAction] = useState<'check' | 'restart' | 'force-complete' | 'force-fail' | null>(null)
  const [fixNote, setFixNote] = useState('')
  
  // Git push state
  const [gitPushLoading, setGitPushLoading] = useState(false)
  const [gitPushMessage, setGitPushMessage] = useState<string | null>(null)
  
  // Memory updated indicator
  const [memoryUpdated, setMemoryUpdated] = useState(false)

  // Poll progress from log file for real-time updates
  const { progress: polledProgress } = useProgressPolling({
    projectId,
    taskId,
    status: task?.status,
    enabled: !!task,
    pollInterval: 2000 // Poll every 2 seconds
  })

  // Fetch task
  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`)
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch task')
      }
      
      setTask(data.task)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, taskId])

  // Initial load and polling
  useEffect(() => {
    fetchTask()
    
    // Poll more frequently for active tasks
    const interval = setInterval(() => {
      if (task?.status === 'active' || task?.status === 'processing' || task?.status === 'pending') {
        fetchTask()
      }
    }, 3000) // 3 seconds for real-time progress
    
    return () => clearInterval(interval)
  }, [fetchTask, task?.status])

  // Start task
  const handleStart = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/start`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start task')
      }
      
      await fetchTask()
    } catch (err: any) {
      alert(`Failed to start task: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Cancel task
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this task?')) {
      return
    }
    
    setActionLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/cancel`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to cancel task')
      }
      
      await fetchTask()
    } catch (err: any) {
      alert(`Failed to cancel task: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Delete task
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task? This cannot be undone.')) {
      return
    }
    
    setActionLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete task')
      }
      
      router.push(`/projects/${projectId}/tasks`)
    } catch (err: any) {
      alert(`Failed to delete task: ${err.message}`)
      setActionLoading(false)
    }
  }

  // Check if task is stuck (processing for > 5 min or failed)
  const isTaskStuck = useCallback((): boolean => {
    if (!task) return false
    
    // Check if status is failed
    if (task.status === 'failed') return true
    
    // Check if processing for too long
    if (task.status === 'processing' && task.startedAt) {
      const startedTime = new Date(task.startedAt).getTime()
      const now = Date.now()
      const minutesSinceStart = (now - startedTime) / 1000 / 60
      return minutesSinceStart > 5
    }
    
    return false
  }, [task])

  // Fix task actions
  const handleFixAction = async (action: 'check' | 'restart' | 'force-complete' | 'force-fail') => {
    setFixAction(action)
    
    if (action === 'force-complete' || action === 'force-fail') {
      setFixModalOpen(true)
      return
    }
    
    await executeFixAction(action)
  }

  const executeFixAction = async (action: 'check' | 'restart' | 'force-complete' | 'force-fail', note?: string) => {
    setFixLoading(true)
    try {
      const body: any = { action }
      if (note) {
        if (action === 'force-complete') body.note = note
        if (action === 'force-fail') body.reason = note
      }

      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to execute fix action')
      }
      
      if (action === 'check') {
        setFixStatus(data.info)
      } else {
        setFixMenuOpen(false)
        setFixModalOpen(false)
        setFixNote('')
        await fetchTask()
        alert(data.message)
      }
    } catch (err: any) {
      alert(`Failed: ${err.message}`)
    } finally {
      setFixLoading(false)
      setFixAction(null)
    }
  }

  const handleFixModalSubmit = () => {
    if (fixAction && (fixAction === 'force-complete' || fixAction === 'force-fail')) {
      executeFixAction(fixAction, fixNote)
    }
  }

  // Create git push task
  const handleGitPush = async () => {
    if (!task) return
    
    setGitPushLoading(true)
    setGitPushMessage(null)
    
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/git-push`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create git push task')
      }
      
      setGitPushMessage(`Git push initiated!`)
      setGitPushLoading(false)
    } catch (err: any) {
      alert(`Failed to create git push task: ${err.message}`)
      setGitPushLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-space-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-neon-cyan">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading task...</span>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-space-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <GlassCard className="p-8 text-center">
            <div className="text-neon-red mb-4">
              <XCircle className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {error || 'Task not found'}
            </h3>
            <Link href={`/projects/${projectId}/tasks`}>
              <NeonButton variant="cyan" className="mt-4">
                Back to Tasks
              </NeonButton>
            </Link>
          </GlassCard>
        </div>
      </div>
    )
  }

  const canStart = task.status === 'created'
  const canCancel = task.status === 'pending' || task.status === 'active' || task.status === 'processing'
  const canDelete = task.status !== 'processing'
  const showFixButton = isTaskStuck()

  return (
    <div className="min-h-screen bg-space-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-space-black/80 backdrop-blur-xl border-b border-space-600/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-xl font-bold text-gray-100 truncate max-w-[300px] sm:max-w-[500px]">
                  {task.title}
                </h1>
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              {canStart && (
                <NeonButton
                  size="sm"
                  variant="green"
                  onClick={handleStart}
                  loading={actionLoading}
                  icon={<Play className="w-4 h-4" />}
                >
                  Start
                </NeonButton>
              )}
              {canCancel && (
                <NeonButton
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  loading={actionLoading}
                  icon={<XCircle className="w-4 h-4" />}
                >
                  Cancel
                </NeonButton>
              )}
              {canDelete && (
                <NeonButton
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  loading={actionLoading}
                  className="border-neon-red/50 text-neon-red hover:bg-neon-red/10"
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Delete
                </NeonButton>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Task Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <GlassCard className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <TaskStatusBadge status={task.status} size="lg" pulse={task.status === 'processing' || task.status === 'active'} />
                    <TaskPriorityBadge priority={task.priority} size="lg" />
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neon-cyan" />
                      Created: {new Date(task.createdAt).toLocaleString()}
                    </div>
                    {task.startedAt && (
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-neon-green" />
                        Started: {new Date(task.startedAt).toLocaleString()}
                      </div>
                    )}
                    {task.completedAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neon-purple" />
                        Completed: {new Date(task.completedAt).toLocaleString()}
                      </div>
                    )}
                    {/* Memory Updated Badge */}
                    {task.status === 'completed' && (
                      <div className="flex items-center gap-2 pt-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-neon-blue/10 text-neon-blue rounded-md text-xs font-medium">
                          <BookOpen className="w-3.5 h-3.5" />
                          Memory Updated
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Fix Task Button */}
                  {showFixButton && (
                    <div className="relative">
                      <NeonButton
                        size="sm"
                        variant="outline"
                        onClick={() => setFixMenuOpen(!fixMenuOpen)}
                        loading={fixLoading}
                        className="border-neon-orange/50 text-neon-orange hover:bg-neon-orange/10"
                        icon={<Wrench className="w-4 h-4" />}
                      >
                        <span className="hidden sm:inline">Fix Task</span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </NeonButton>
                      
                      {/* Fix Menu Dropdown */}
                      {fixMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-space-800 border border-space-600 rounded-xl shadow-xl z-50 overflow-hidden">
                          <div className="p-2 space-y-1">
                            <button
                              onClick={() => handleFixAction('check')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-space-700 rounded-lg transition-colors"
                            >
                              <Activity className="w-4 h-4 text-neon-cyan" />
                              Check Status
                            </button>
                            <button
                              onClick={() => handleFixAction('restart')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-space-700 rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-4 h-4 text-neon-green" />
                              Restart Task
                            </button>
                            <button
                              onClick={() => handleFixAction('force-complete')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-space-700 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 text-neon-blue" />
                              Force Complete
                            </button>
                            <button
                              onClick={() => handleFixAction('force-fail')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-space-700 rounded-lg transition-colors"
                            >
                              <XOctagon className="w-4 h-4 text-neon-red" />
                              Force Fail
                            </button>
                          </div>
                          
                          {/* Status Display */}
                          {fixStatus && (
                            <div className="border-t border-space-700 p-3 bg-space-900/50">
                              <p className="text-xs font-medium text-gray-400 mb-2">Status Check Result:</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Status:</span>
                                  <span className={fixStatus.isStuck ? 'text-neon-red' : 'text-neon-green'}>
                                    {fixStatus.status}
                                  </span>
                                </div>
                                {fixStatus.processingDuration !== null && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Duration:</span>
                                    <span className="text-gray-300">{fixStatus.processingDuration} min</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Agent:</span>
                                  <span className="text-gray-300 truncate max-w-[100px]">
                                    {fixStatus.assignedAgent || 'None'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Refresh Button */}
                  <button
                    onClick={fetchTask}
                    disabled={actionLoading}
                    className="p-2 text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 
                      rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${actionLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Live Logs - Real-time streaming (always show) */}
            <TaskLogViewer 
              projectId={projectId}
              taskId={taskId}
              status={task.status}
            />

            {/* Description */}
            {task.description && (
              <GlassCard className="p-6">
                <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-neon-cyan" />
                  Description
                </h3>
                <p className="text-gray-300 whitespace-pre-wrap">{task.description}</p>
              </GlassCard>
            )}

            {/* Results */}
            <TaskResultViewer task={task} />

            {/* Git Operations - Show for completed tasks or tasks with artifacts */}
            {shouldShowGitPushButton(task) && (
              <GlassCard className="p-6 border-neon-purple/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-neon-purple/10 rounded-lg">
                    <GitBranch className="w-5 h-5 text-neon-purple" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-200">
                    🚀 Git Operations
                  </h3>
                </div>

                {/* Files created by this task */}
                {task.artifacts && task.artifacts.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <FileCode className="w-4 h-4" />
                      Files created by this task:
                    </p>
                    <div className="bg-space-800/50 rounded-lg p-3 space-y-1">
                      {getArtifactFileList(task).map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                          <span className="text-neon-cyan">•</span>
                          <code className="text-neon-green">{file}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commit & Push Button */}
                <div className="flex flex-col gap-3">
                  <NeonButton
                    variant="purple"
                    onClick={handleGitPush}
                    loading={gitPushLoading}
                    disabled={gitPushMessage !== null}
                    icon={<Rocket className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                  >
                    {gitPushMessage || 'Commit & Push to Git'}
                  </NeonButton>

                  {/* What this will do */}
                  <div className="text-sm text-gray-500 bg-space-800/30 rounded-lg p-3">
                    <p className="mb-2">This will create a new task to:</p>
                    <ul className="space-y-1 ml-4">
                      <li className="flex items-center gap-2">
                        <span className="text-neon-cyan">•</span>
                        Stage all changes
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-neon-cyan">•</span>
                        Create commit with message referencing this task
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-neon-cyan">•</span>
                        Push to remote repository
                      </li>
                    </ul>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right Column - Meta Info */}
          <div className="space-y-6">
            {/* Assigned Agent */}
            <GlassCard className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-neon-cyan" />
                Assigned Agent
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-neon-cyan/10 text-neon-cyan rounded-lg text-sm font-medium">
                    {task.agentId || 'Default Agent'}
                  </span>
                </div>
                {task.assignedAgent && (
                  <div className="p-3 bg-space-800/50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Session Key:</p>
                    <code className="text-xs text-neon-cyan break-all">
                      {task.assignedAgent}
                    </code>
                  </div>
                )}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={task.status === 'processing' ? 'text-neon-cyan' : 'text-gray-300'}>
                      {task.status === 'processing' ? 'Active' : 'Idle'}
                    </span>
                  </div>
                  {task.startedAt && (
                    <div className="flex justify-between">
                      <span>Started:</span>
                      <span>{new Date(task.startedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Retry Info */}
            {(task.retryCount !== undefined || task.maxRetries !== undefined) && (
              <GlassCard className="p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Retry Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Retry Count:</span>
                    <span className="text-gray-300">{task.retryCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max Retries:</span>
                    <span className="text-gray-300">{task.maxRetries || 2}</span>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Task ID */}
            <GlassCard className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Task ID</h3>
              <code className="text-xs text-gray-500 break-all">{task.id}</code>
            </GlassCard>
          </div>
        </div>
      </main>

      {/* Fix Modal */}
      {fixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md mx-4">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  fixAction === 'force-complete' ? 'bg-neon-blue/10' : 'bg-neon-red/10'
                }`}>
                  {fixAction === 'force-complete' ? (
                    <CheckCircle className="w-6 h-6 text-neon-blue" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-neon-red" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-200">
                    {fixAction === 'force-complete' ? 'Force Complete Task' : 'Force Fail Task'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {fixAction === 'force-complete' 
                      ? 'Mark this task as completed manually'
                      : 'Mark this task as failed with a reason'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {fixAction === 'force-complete' ? 'Completion Note' : 'Failure Reason'}
                </label>
                <textarea
                  value={fixNote}
                  onChange={(e) => setFixNote(e.target.value)}
                  placeholder={fixAction === 'force-complete' 
                    ? 'Why are you completing this task?'
                    : 'Why is this task being marked as failed?'
                  }
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-gray-200 
                    placeholder-gray-500 focus:outline-none focus:border-neon-cyan resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <NeonButton
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setFixModalOpen(false)
                    setFixNote('')
                    setFixAction(null)
                  }}
                >
                  Cancel
                </NeonButton>
                <NeonButton
                  variant={fixAction === 'force-complete' ? 'green' : 'pink'}
                  className="flex-1"
                  onClick={handleFixModalSubmit}
                  loading={fixLoading}
                  disabled={!fixNote.trim()}
                >
                  {fixAction === 'force-complete' ? 'Complete' : 'Fail'}
                </NeonButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
