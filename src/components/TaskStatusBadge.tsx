'use client'

import { Task, TaskStatus, TaskPriority } from '@/types/task'
import { 
  Circle, Clock, Play, Loader2, CheckCircle2, XCircle, 
  AlertCircle, MinusCircle 
} from 'lucide-react'

interface TaskStatusBadgeProps {
  status: TaskStatus
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

const statusConfig: Record<TaskStatus, {
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  glowColor: string
  pulse?: boolean
}> = {
  created: {
    label: 'Created',
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    glowColor: 'shadow-gray-500/20',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    glowColor: 'shadow-yellow-500/20',
  },
  active: {
    label: 'Active',
    icon: Play,
    color: 'text-neon-blue',
    bgColor: 'bg-neon-blue/10',
    borderColor: 'border-neon-blue/40',
    glowColor: 'shadow-neon-blue/30',
    pulse: true,
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    color: 'text-neon-purple',
    bgColor: 'bg-neon-purple/10',
    borderColor: 'border-neon-purple/40',
    glowColor: 'shadow-neon-purple/30',
    pulse: true,
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-neon-green',
    bgColor: 'bg-neon-green/10',
    borderColor: 'border-neon-green/40',
    glowColor: 'shadow-neon-green/30',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-neon-red',
    bgColor: 'bg-neon-red/10',
    borderColor: 'border-neon-red/40',
    glowColor: 'shadow-neon-red/30',
  },
  cancelled: {
    label: 'Cancelled',
    icon: MinusCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    glowColor: 'shadow-gray-500/20',
  },
}

export default function TaskStatusBadge({ 
  status, 
  showLabel = true, 
  size = 'md',
  pulse = false 
}: TaskStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const shouldPulse = pulse && (status === 'active' || status === 'processing')

  return (
    <span className={`
      inline-flex items-center rounded-lg border
      ${config.bgColor}
      ${config.borderColor}
      ${config.color}
      ${sizeStyles[size]}
      font-medium tracking-wide
      ${shouldPulse ? 'animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.3)]' : ''}
    `}>
      <Icon className={`${iconSizes[size]} ${shouldPulse ? 'animate-spin' : ''}`} />
      {showLabel && config.label}
    </span>
  )
}

// Priority Badge Component
interface TaskPriorityBadgeProps {
  priority: TaskPriority
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const priorityConfig: Record<TaskPriority, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  glow?: boolean
}> = {
  low: {
    label: 'Low',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
  },
  medium: {
    label: 'Medium',
    color: 'text-neon-blue',
    bgColor: 'bg-neon-blue/10',
    borderColor: 'border-neon-blue/30',
  },
  high: {
    label: 'High',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-neon-red',
    bgColor: 'bg-neon-red/10',
    borderColor: 'border-neon-red/40',
    glow: true,
  },
}

export function TaskPriorityBadge({ 
  priority, 
  showLabel = true, 
  size = 'md' 
}: TaskPriorityBadgeProps) {
  const config = priorityConfig[priority]
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span className={`
      inline-flex items-center rounded-lg border
      ${config.bgColor}
      ${config.borderColor}
      ${config.color}
      ${sizeStyles[size]}
      font-medium tracking-wide
      ${config.glow ? 'shadow-[0_0_10px_rgba(255,51,51,0.3)]' : ''}
    `}>
      {showLabel && config.label}
    </span>
  )
}
