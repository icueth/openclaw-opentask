'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface ProgressData {
  percentage: number
  message: string
  timestamp: number
  exitCode?: number
  source: string
}

interface UseProgressPollingOptions {
  projectId: string
  taskId: string
  pollInterval?: number
  enabled?: boolean
  status?: string
}

interface UseProgressPollingState {
  progress: ProgressData | null
  loading: boolean
  error: string | null
}

/**
 * Hook to poll progress from the log file for CLI-spawned tasks
 * This provides real-time progress updates independent of the task object polling
 */
export function useProgressPolling({
  projectId,
  taskId,
  pollInterval = 2000,
  enabled = true,
  status
}: UseProgressPollingOptions): UseProgressPollingState {
  const [state, setState] = useState<UseProgressPollingState>({
    progress: null,
    loading: false,
    error: null
  })
  
  // Track last progress to avoid unnecessary updates
  const lastProgressRef = useRef<number>(0)
  const lastMessageRef = useRef<string>('')

  const fetchProgress = useCallback(async () => {
    if (!enabled || !taskId) return

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/progress`)
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        // Not JSON - might be HTML error page
        const text = await res.text()
        console.warn('[ProgressPolling] Non-JSON response:', text.substring(0, 100))
        return
      }
      
      const data = await res.json()

      if (!data.success) {
        // No progress data yet - this is normal for newly started tasks
        return
      }

      // Only update state if progress has changed
      const newProgress = data.progress ?? 0
      const newMessage = data.currentStep || data.progress?.message || ''
      
      if (newProgress !== lastProgressRef.current || newMessage !== lastMessageRef.current) {
        lastProgressRef.current = newProgress
        lastMessageRef.current = newMessage
        
        setState({
          progress: {
            percentage: newProgress,
            message: newMessage,
            timestamp: data.timestamp || Date.now(),
            exitCode: data.exitCode,
            source: data.source || 'log'
          },
          loading: false,
          error: null
        })
      }
    } catch (err: any) {
      // Silently fail - progress polling is best-effort
      setState(prev => ({
        ...prev,
        error: err.message
      }))
    }
  }, [projectId, taskId, enabled])

  // Poll for progress when task is processing
  useEffect(() => {
    if (!enabled) return

    // Only poll for active/processing tasks
    const shouldPoll = status === 'processing' || status === 'active' || status === 'pending'
    
    if (!shouldPoll) {
      return
    }

    // Initial fetch
    fetchProgress()

    // Set up polling interval
    const interval = setInterval(() => {
      fetchProgress()
    }, pollInterval)

    return () => clearInterval(interval)
  }, [fetchProgress, pollInterval, enabled, status])

  return state
}

export default useProgressPolling
