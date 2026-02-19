'use client'

import { useState, useEffect } from 'react'
import { CreateTaskRequest, TaskPriority } from '@/types/task'
import NeonButton from './NeonButton'
import GlassCard from './GlassCard'
import { 
  AlertCircle, Loader2, Sparkles, FileText, Flag, Bot
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  description?: string
  model?: string
}

interface TaskFormProps {
  projectId: string
  projectAgentId?: string  // Inherited agent from project
  projectAgentName?: string
  initialData?: Partial<CreateTaskRequest>
  onSubmit: (data: CreateTaskRequest) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  error?: string | null
}

const priorities: { value: TaskPriority; label: string; color: string; description: string }[] = [
  { 
    value: 'low', 
    label: 'Low', 
    color: 'text-gray-400 border-gray-500/30 hover:border-gray-500/50',
    description: 'Can be done when convenient'
  },
  { 
    value: 'medium', 
    label: 'Medium', 
    color: 'text-neon-blue border-neon-blue/30 hover:border-neon-blue/50',
    description: 'Standard priority task'
  },
  { 
    value: 'high', 
    label: 'High', 
    color: 'text-orange-400 border-orange-500/30 hover:border-orange-500/50',
    description: 'Important, should be done soon'
  },
  { 
    value: 'urgent', 
    label: 'Urgent', 
    color: 'text-neon-red border-neon-red/30 hover:border-neon-red/50 shadow-[0_0_10px_rgba(255,51,51,0.2)]',
    description: 'Critical priority, immediate attention'
  },
]

export default function TaskForm({
  projectId,
  projectAgentId,
  projectAgentName,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  error = null
}: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority || 'medium')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [autoStart, setAutoStart] = useState(initialData?.autoStart !== false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!title.trim()) {
      setValidationError('Title is required')
      return
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      // agentId is inherited from project if not specified
      autoStart
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Display */}
      {(error || validationError) && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-neon-red/10 border border-neon-red/30">
          <AlertCircle className="w-5 h-5 text-neon-red flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-neon-red font-medium">
              {validationError || 'Error creating task'}
            </p>
            {error && <p className="text-neon-red/70 text-sm mt-1">{error}</p>}
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Sparkles className="w-4 h-4 text-neon-cyan" />
          Task Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a clear, concise task title..."
          disabled={loading}
          className="w-full px-4 py-3 bg-space-800/50 border border-space-600/50 rounded-xl
            text-gray-200 placeholder-gray-600
            focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30
            transition-all disabled:opacity-50"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <FileText className="w-4 h-4 text-neon-purple" />
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what needs to be done..."
          disabled={loading}
          rows={4}
          className="w-full px-4 py-3 bg-space-800/50 border border-space-600/50 rounded-xl
            text-gray-200 placeholder-gray-600 resize-none
            focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30
            transition-all disabled:opacity-50"
        />
      </div>

      {/* Agent Info - Inherited from Project */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Bot className="w-4 h-4 text-neon-green" />
          Assigned Agent
        </label>
        <GlassCard className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <p className="text-gray-200 font-medium">
                {projectAgentName || projectAgentId || 'Project Agent'}
              </p>
              <p className="text-xs text-gray-500">
                Inherited from project • Cannot be changed
              </p>
            </div>
          </div>
        </GlassCard>
        <p className="text-xs text-gray-500">
          Task will be executed by the project&apos;s assigned agent. The agent will spawn a sub-agent to handle the task.
        </p>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Flag className="w-4 h-4 text-neon-pink" />
          Priority
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {priorities.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              disabled={loading}
              className={`
                relative p-3 rounded-xl border text-left transition-all
                ${priority === p.value 
                  ? `${p.color} bg-opacity-10 ring-1 ring-current` 
                  : 'border-space-600/50 text-gray-500 hover:border-space-500/50 hover:text-gray-400'
                }
                disabled:opacity-50
              `}
            >
              <div className={`font-semibold ${priority === p.value ? p.color.split(' ')[0] : ''}`}>
                {p.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {p.description}
              </div>
              {priority === p.value && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Auto Start */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-space-600/30 bg-space-800/30">
        <input
          type="checkbox"
          id="autoStart"
          checked={autoStart}
          onChange={(e) => setAutoStart(e.target.checked)}
          disabled={loading}
          className="w-4 h-4 rounded border-space-600 bg-space-800 text-neon-cyan 
            focus:ring-neon-cyan/30 focus:ring-2"
        />
        <label htmlFor="autoStart" className="text-sm text-gray-300 cursor-pointer flex-1">
          Auto-start task after creation
        </label>
      </div>

      {/* Project Info */}
      <GlassCard variant="default" className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-400">Project:</span>
          <code className="px-2 py-0.5 bg-space-800 rounded text-neon-cyan/70">
            {projectId}
          </code>
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-space-600/30">
        {onCancel && (
          <NeonButton
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </NeonButton>
        )}
        <NeonButton
          type="submit"
          loading={loading}
          disabled={loading || !title.trim()}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Create Task
        </NeonButton>
      </div>
    </form>
  )
}