'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task } from '@/types/task'

interface UseTaskProgressOptions {
  projectId: string
  taskId: string
  pollInterval?: number
  enabled?: boolean
}

interface TaskProgressState {
  task: Task | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function useTaskProgress({
  projectId,
  taskId,
  pollInterval = 3000,
  enabled = true
}: UseTaskProgressOptions) {
  const [state, setState] = useState<TaskProgressState>({
    task: null,
    loading: true,
    error: null,
    lastUpdated: null
  })

  const fetchTask = useCallback(async () => {
    if (!enabled) return

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`)
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch task')
      }

      setState(prev => ({
        ...prev,
        task: data.task,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }))
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message,
        loading: false
      }))
    }
  }, [projectId, taskId, enabled])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchTask()
    }
  }, [fetchTask, enabled])

  // Polling
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      // Only poll if task is active/processing/pending
      const shouldPoll = state.task?.status === 'processing' || 
                         state.task?.status === 'active' || 
                         state.task?.status === 'pending'
      
      if (shouldPoll) {
        fetchTask()
      }
    }, pollInterval)

    return () => clearInterval(interval)
  }, [fetchTask, pollInterval, enabled, state.task?.status])

  // Manual refresh
  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }))
    fetchTask()
  }, [fetchTask])

  // Check if task is stuck (processing for > 5 minutes)
  const isStuck = useCallback((): boolean => {
    const task = state.task
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
  }, [state.task])

  // Get time since last update
  const getTimeSinceLastUpdate = useCallback((): string => {
    const task = state.task
    if (!task || task.progressUpdates?.length === 0) return ''

    const lastUpdate = task.progressUpdates![task.progressUpdates!.length - 1]
    const lastUpdateTime = new Date(lastUpdate.timestamp).getTime()
    const now = Date.now()
    const diffMin = Math.floor((now - lastUpdateTime) / 1000 / 60)

    if (diffMin < 1) return 'just now'
    if (diffMin === 1) return '1 minute ago'
    return `${diffMin} minutes ago`
  }, [state.task])

  return {
    ...state,
    refresh,
    isStuck: isStuck(),
    timeSinceLastUpdate: getTimeSinceLastUpdate()
  }
}
