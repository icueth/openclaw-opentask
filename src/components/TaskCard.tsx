'use client'

import { Task } from '@/types/task'
import TaskStatusBadge, { TaskPriorityBadge } from './TaskStatusBadge'
import GlassCard from './GlassCard'
import { 
  Calendar, User, ArrowRight, MoreVertical, Play, RotateCcw, Trash2,
  FileText, CheckCircle, AlertCircle, FolderOpen
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface TaskCardProps {
  task: Task
  viewMode?: 'grid' | 'list'
  onStart?: (taskId: string) => void
  onRetry?: (taskId: string) => void
  onDelete?: (taskId: string) => void
  compact?: boolean
}

export default function TaskCard({ 
  task, 
  viewMode = 'grid',
  onStart,
  onRetry,
  onDelete,
  compact = false
}: TaskCardProps) {
  const isActive = task.status === 'active' || task.status === 'processing'
  const hasFailed = task.status === 'failed'
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (compact) {
    return (
      <Link href={`/projects/${task.projectId}/tasks/${task.id}`}>
        <div className={`
          group flex items-center gap-3 p-3 rounded-lg border
          bg-space-800/50 border-space-600/50
          hover:border-neon-cyan/30 hover:bg-space-700/50
          transition-all duration-200
          ${isActive ? 'border-neon-purple/30 shadow-[0_0_10px_rgba(184,41,247,0.1)]' : ''}
        `}>
          <TaskStatusBadge status={task.status} size="sm" pulse={isActive} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-200 truncate font-medium">{task.title}</p>
            <p className="text-xs text-gray-500 truncate">{task.agentId || 'No agent assigned'}</p>
          </div>
          {task.assignedAgent && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User className="w-3 h-3" />
              {task.assignedAgent}
            </div>
          )}
        </div>
      </Link>
    )
  }

  if (viewMode === 'list') {
    return (
      <Link href={`/projects/${task.projectId}/tasks/${task.id}`}>
        <div className={`
          group flex items-center gap-4 p-4 rounded-xl border
          bg-space-800/50 border-space-600/50
          hover:border-neon-cyan/30 hover:bg-space-700/50
          transition-all duration-200
          ${isActive ? 'border-neon-purple/30 shadow-[0_0_15px_rgba(184,41,247,0.15)]' : ''}
        `}>
          <TaskStatusBadge status={task.status} size="md" pulse={isActive} />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-200 font-medium truncate group-hover:text-neon-cyan transition-colors">
              {task.title}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {task.description || 'No description'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <TaskPriorityBadge priority={task.priority} size="sm" />
            
            {task.assignedAgent && (
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{task.assignedAgent}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">{formatDate(task.createdAt)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              {task.status === 'created' && onStart && (
                <button
                  onClick={(e) => { e.preventDefault(); onStart(task.id); }}
                  className="p-2 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-lg transition-colors"
                  title="Start Task"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              {hasFailed && onRetry && (
                <button
                  onClick={(e) => { e.preventDefault(); onRetry(task.id); }}
                  className="p-2 text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors"
                  title="Retry Task"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.preventDefault(); onDelete(task.id); }}
                  className="p-2 text-gray-400 hover:text-neon-red hover:bg-neon-red/10 rounded-lg transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-neon-cyan transition-colors" />
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Grid view
  return (
    <GlassCard 
      variant={isActive ? 'purple' : hasFailed ? 'pink' : task.status === 'completed' ? 'green' : 'default'}
      className={`group ${isActive ? 'animate-pulse-glow-purple' : ''}`}
    >
      <Link href={`/projects/${task.projectId}/tasks/${task.id}`}>
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <TaskStatusBadge status={task.status} size="sm" pulse={isActive} />
            <TaskPriorityBadge priority={task.priority} size="sm" />
          </div>
          
          {/* Title */}
          <h3 className="text-gray-200 font-medium line-clamp-2 group-hover:text-neon-cyan transition-colors">
            {task.title}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
            {task.description || 'No description provided'}
          </p>
          
          {/* Result Preview (for completed tasks) */}
          {task.status === 'completed' && task.result && (
            <div className="p-2 bg-neon-green/5 border border-neon-green/20 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-neon-green mb-1">
                <CheckCircle className="w-3 h-3" />
                <span className="font-medium">Result</span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">
                {task.result.split('\n')[0]}
              </p>
            </div>
          )}
          
          {/* Error Preview (for failed tasks) */}
          {hasFailed && task.error && (
            <div className="p-2 bg-neon-red/5 border border-neon-red/20 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-neon-red mb-1">
                <AlertCircle className="w-3 h-3" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">
                {task.error.split('\n')[0]}
              </p>
            </div>
          )}
          
          {/* Artifacts Preview */}
          {task.artifacts && task.artifacts.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <FolderOpen className="w-3 h-3 text-neon-cyan" />
              <span>{task.artifacts.length} file{task.artifacts.length !== 1 ? 's' : ''} created</span>
            </div>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-space-600/50">
            <div className="flex items-center gap-3">
              {task.assignedAgent ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-[80px]">{task.assignedAgent}</span>
                </div>
              ) : (
                <span className="text-xs text-gray-600 italic">Unassigned</span>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {formatDate(task.createdAt)}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-1 pt-1">
            {task.status === 'created' && onStart && (
              <button
                onClick={(e) => { e.preventDefault(); onStart(task.id); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium
                  bg-neon-green/10 text-neon-green border border-neon-green/30 rounded-lg
                  hover:bg-neon-green/20 transition-colors"
              >
                <Play className="w-3 h-3" />
                Start
              </button>
            )}
            {hasFailed && onRetry && (
              <button
                onClick={(e) => { e.preventDefault(); onRetry(task.id); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium
                  bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-lg
                  hover:bg-neon-cyan/20 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        </div>
      </Link>
    </GlassCard>
  )
}