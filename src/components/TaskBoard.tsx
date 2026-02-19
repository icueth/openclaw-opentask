'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, TaskStatus } from '@/types/task'
import TaskCard from './TaskCard'
import GlassCard from './GlassCard'
import { 
  LayoutGrid, List, Plus, RefreshCw, Filter,
  ClipboardList 
} from 'lucide-react'
import NeonButton from './NeonButton'
import Link from 'next/link'

interface TaskBoardProps {
  projectId: string
  tasks: Task[]
  loading?: boolean
  onRefresh?: () => void
  onStartTask?: (taskId: string) => void
  onRetryTask?: (taskId: string) => void
  onDeleteTask?: (taskId: string) => void
  readOnly?: boolean
}

const columns: TaskStatus[] = ['created', 'pending', 'active', 'processing', 'completed', 'failed', 'cancelled']

const columnConfig: Record<TaskStatus, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  glowColor?: string
}> = {
  created: {
    label: 'Created',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/5',
    borderColor: 'border-gray-500/20',
  },
  pending: {
    label: 'Pending',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/5',
    borderColor: 'border-yellow-500/20',
  },
  active: {
    label: 'Active',
    color: 'text-neon-blue',
    bgColor: 'bg-neon-blue/5',
    borderColor: 'border-neon-blue/30',
    glowColor: 'shadow-[0_0_20px_rgba(0,128,255,0.1)]',
  },
  processing: {
    label: 'Processing',
    color: 'text-neon-purple',
    bgColor: 'bg-neon-purple/5',
    borderColor: 'border-neon-purple/30',
    glowColor: 'shadow-[0_0_20px_rgba(184,41,247,0.1)]',
  },
  completed: {
    label: 'Completed',
    color: 'text-neon-green',
    bgColor: 'bg-neon-green/5',
    borderColor: 'border-neon-green/20',
  },
  failed: {
    label: 'Failed',
    color: 'text-neon-red',
    bgColor: 'bg-neon-red/5',
    borderColor: 'border-neon-red/20',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/5',
    borderColor: 'border-gray-500/20',
  },
}

export default function TaskBoard({
  projectId,
  tasks,
  loading = false,
  onRefresh,
  onStartTask,
  onRetryTask,
  onDeleteTask,
  readOnly = false
}: TaskBoardProps) {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all')
  const [polling, setPolling] = useState(false)

  // Group tasks by status
  const tasksByStatus = columns.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  // Filter tasks for list view
  const filteredTasks = selectedStatus === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === selectedStatus)

  // Auto-poll for active tasks
  const hasActiveTasks = tasks.some(t => t.status === 'active' || t.status === 'processing' || t.status === 'pending')
  
  useEffect(() => {
    if (!hasActiveTasks || !onRefresh) return
    
    setPolling(true)
    const interval = setInterval(() => {
      onRefresh()
    }, 5000)
    
    return () => {
      clearInterval(interval)
      setPolling(false)
    }
  }, [hasActiveTasks, onRefresh])

  const handleStart = useCallback((taskId: string) => {
    onStartTask?.(taskId)
  }, [onStartTask])

  const handleRetry = useCallback((taskId: string) => {
    onRetryTask?.(taskId)
  }, [onRetryTask])

  const handleDelete = useCallback((taskId: string) => {
    onDeleteTask?.(taskId)
  }, [onDeleteTask])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-neon-cyan">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading tasks...</span>
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <ClipboardList className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Tasks Yet</h3>
        <p className="text-gray-500 mb-6">Create your first task to get started</p>
        {!readOnly && (
          <Link href={`/projects/${projectId}/tasks/new`}>
            <NeonButton icon={<Plus className="w-4 h-4" />}>
              Create Task
            </NeonButton>
          </Link>
        )}
      </GlassCard>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-space-800/50 rounded-lg p-1 border border-space-600/50">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'board'
                  ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>

          {/* Status Filter (List view only) */}
          {viewMode === 'list' && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as TaskStatus | 'all')}
                className="pl-9 pr-4 py-1.5 bg-space-800/50 border border-space-600/50 rounded-lg
                  text-sm text-gray-300 focus:border-neon-cyan/50 focus:outline-none"
              >
                <option value="all">All Status</option>
                {columns.map(status => (
                  <option key={status} value={status}>
                    {columnConfig[status].label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Task Count */}
          <span className="text-sm text-gray-500">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
          
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={polling}
              className={`p-2 rounded-lg text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10
                border border-transparent hover:border-neon-cyan/30 transition-all
                ${polling ? 'animate-pulse' : ''}`}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${polling ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Create Button */}
          {!readOnly && (
            <Link href={`/projects/${projectId}/tasks/new`}>
              <NeonButton size="sm" icon={<Plus className="w-4 h-4" />}>
                New Task
              </NeonButton>
            </Link>
          )}
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
          {columns.map(status => {
            const statusTasks = tasksByStatus[status]
            const config = columnConfig[status]
            
            return (
              <div 
                key={status}
                className={`flex flex-col rounded-xl border ${config.borderColor} ${config.bgColor} ${config.glowColor || ''}
                  min-h-[400px] max-h-[calc(100vh-280px)]`}
              >
                {/* Column Header */}
                <div className={`
                  flex items-center justify-between px-3 py-2 border-b ${config.borderColor}
                  sticky top-0 rounded-t-xl backdrop-blur-sm
                `}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${config.color}`}>
                      {config.label}
                    </span>
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-medium
                      ${statusTasks.length > 0 ? 'bg-space-700 text-gray-300' : 'bg-space-800 text-gray-600'}
                    `}>
                      {statusTasks.length}
                    </span>
                  </div>
                </div>
                
                {/* Tasks */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {statusTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      viewMode="grid"
                      onStart={handleStart}
                      onRetry={handleRetry}
                      onDelete={handleDelete}
                    />
                  ))}
                  {statusTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-600">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-700 mb-2" />
                      <span className="text-xs">No tasks</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              viewMode="list"
              onStart={handleStart}
              onRetry={handleRetry}
              onDelete={handleDelete}
            />
          ))}
          {filteredTasks.length === 0 && (
            <GlassCard className="p-12 text-center">
              <p className="text-gray-500">No tasks match the selected filter</p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  )
}
