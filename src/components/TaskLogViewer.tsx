'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import GlassCard from './GlassCard'
import { Terminal, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  metadata?: any
}

interface TaskLogViewerProps {
  projectId: string
  taskId: string
  status: string
}

export default function TaskLogViewer({ projectId, taskId, status }: TaskLogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [offset, setOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch logs
  const fetchLogs = useCallback(async (currentOffset: number = 0) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/logs?offset=${currentOffset}&stream=true`)
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }

      if (data.logs.length > 0) {
        setLogs(prev => [...prev, ...data.logs])
        setOffset(data.offset)
      }
      
      setIsComplete(data.isComplete)
      
      return data.isComplete
    } catch (err: any) {
      setError(err.message)
      return true // Stop polling on error
    }
  }, [projectId, taskId])

  // Initial load
  useEffect(() => {
    setIsLoading(true)
    fetchLogs(0).then(() => {
      setIsLoading(false)
      scrollToBottom()
    })
  }, [fetchLogs])

  // Polling for new logs
  useEffect(() => {
    if (isComplete || status === 'completed' || status === 'failed') {
      return
    }

    pollIntervalRef.current = setInterval(async () => {
      const complete = await fetchLogs(offset)
      if (!complete) {
        scrollToBottom()
      }
    }, 2000) // Poll every 2 seconds

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [offset, isComplete, status, fetchLogs])

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  // Get log level icon and color
  const getLogStyle = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'text-neon-green', bg: 'bg-neon-green/10' }
      case 'error':
        return { icon: <XCircle className="w-4 h-4" />, color: 'text-neon-red', bg: 'bg-neon-red/10' }
      case 'warn':
        return { icon: <AlertCircle className="w-4 h-4" />, color: 'text-neon-orange', bg: 'bg-neon-orange/10' }
      default:
        return { icon: <Terminal className="w-4 h-4" />, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' }
    }
  }

  // Show loading state
  if (isLoading && logs.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading logs...</span>
        </div>
      </GlassCard>
    )
  }

  // Show empty state
  if (logs.length === 0 && !isLoading) {
    return (
      <GlassCard className="p-8 text-center">
        <Terminal className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-400">No logs available</h3>
        <p className="text-gray-500 mt-2">
          Task status: <span className="text-neon-cyan">{status}</span>
          {status === 'completed' && ' - Task completed without detailed logs'}
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-space-800/50 border-b border-space-600/30">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-neon-cyan" />
          <span className="font-medium text-gray-200">Task Logs</span>
          <span className="text-xs text-gray-500">({logs.length} entries)</span>
        </div>
        <div className="flex items-center gap-2">
          {!isComplete && status !== 'completed' && status !== 'failed' && (
            <div className="flex items-center gap-1.5 text-xs text-neon-cyan">
              <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
              Live
            </div>
          )}
          {isComplete && (
            <span className="text-xs text-neon-green flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Complete
            </span>
          )}
        </div>
      </div>

      {/* Log entries */}
      <div className="max-h-[500px] overflow-y-auto p-4 space-y-2 font-mono text-sm">
        {logs.map((log, index) => {
          const style = getLogStyle(log.level)
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-space-800/30 transition-colors group"
            >
              <span className="text-xs text-gray-500 whitespace-nowrap pt-0.5">
                {formatTime(log.timestamp)}
              </span>
              
              <div className={`flex-shrink-0 mt-0.5 ${style.color}`}>
                {style.icon}
              </div>
              
              <div className={`flex-1 ${style.color}`}>
                {log.message}
              </div>
            </div>
          )
        })}
        <div ref={logsEndRef} />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-space-800/30 border-t border-space-600/30 text-xs text-gray-500 flex justify-between items-center">
        <span>Auto-refresh every 2s</span>
        {error && <span className="text-neon-red">Error: {error}</span>}
      </div>
    </GlassCard>
  )
}
