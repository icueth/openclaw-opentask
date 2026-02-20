// Task Management Types

export type TaskStatus = 'created' | 'pending' | 'active' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  agentId: string        // Which agent handles this task
  assignedAgent?: string // Session key of spawned sub-agent
  result?: string
  error?: string
  artifacts?: string[]
  statusHistory: StatusChange[]
  createdAt: string
  startedAt?: string
  completedAt?: string
  retryCount?: number
  maxRetries?: number
  timeoutMinutes?: number
  progress?: number              // 0-100 progress percentage
  progressUpdates?: ProgressUpdate[]  // History of progress updates
  currentStep?: string           // Current step description
  agentCount?: number            // Number of agents spawned for this task
  agentThinkingLevels?: number[] // Thinking level for each agent
}

export interface StatusChange {
  status: TaskStatus
  timestamp: string
  message?: string
}

export interface ProgressUpdate {
  percentage: number
  message: string
  timestamp: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  agentId?: string      // Inherited from project if not specified
  priority: TaskPriority
  maxRetries?: number
  timeoutMinutes?: number
  autoStart?: boolean
  agentCount?: number   // Number of agents to spawn (1-5, default 1)
  agentThinkingLevels?: number[] // Thinking level for each agent (1-5)
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  priority?: TaskPriority
  agentId?: string
  maxRetries?: number
  timeoutMinutes?: number
}

export interface TaskSummary {
  total: number
  byStatus: Record<TaskStatus, number>
  recent: Task[]
}