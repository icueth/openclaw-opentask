'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, TaskStatus } from '@/types/task'

interface UseTasksOptions {
  projectId?: string
  status?: TaskStatus[]
  pollInterval?: number
  autoStart?: boolean
}

interface UseTasksReturn {
  tasks: Task[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createTask: (data: CreateTaskData) => Promise<Task | null>
  cancelTask: (taskId: string) => Promise<boolean>
  deleteTask: (taskId: string) => Promise<boolean>
}

interface CreateTaskData {
  title: string
  description?: string
  agentId: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  autoStart?: boolean
}

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { projectId, status, pollInterval = 5000, autoStart = true } = options
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      let url = '/api/tasks'
      if (projectId) {
        url = `/api/projects/${projectId}/tasks`
      }
      
      if (status && status.length > 0) {
        url += `?status=${status.join(',')}`
      }
      
      const res = await fetch(url)
      const data = await res.json()
      
      if (data.success) {
        setTasks(data.tasks || [])
      } else {
        setError(data.error || 'Failed to fetch tasks')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [projectId, status])

  const createTask = async (data: CreateTaskData): Promise<Task | null> => {
    if (!projectId) {
      setError('Project ID required to create task')
      return null
    }
    
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          autoStart: data.autoStart !== false
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        setTasks(prev => [result.task, ...prev])
        return result.task
      } else {
        setError(result.error || 'Failed to create task')
        return null
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create task')
      return null
    }
  }

  const cancelTask = async (taskId: string): Promise<boolean> => {
    if (!projectId) return false
    
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/cancel`, {
        method: 'POST'
      })
      
      const result = await res.json()
      
      if (result.success) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'cancelled' } : t
        ))
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }

  const deleteTask = async (taskId: string): Promise<boolean> => {
    if (!projectId) return false
    
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      
      if (result.success) {
        setTasks(prev => prev.filter(t => t.id !== taskId))
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }

  useEffect(() => {
    if (autoStart) {
      fetchTasks()
    }
  }, [fetchTasks, autoStart])

  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return
    
    const interval = setInterval(fetchTasks, pollInterval)
    return () => clearInterval(interval)
  }, [fetchTasks, pollInterval])

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    cancelTask,
    deleteTask
  }
}

export default useTasks