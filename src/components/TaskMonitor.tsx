/**
 * Task Monitor Component
 * Real-time display of task status and progress using WebSocket
 */

'use client'

import { useState, useEffect } from 'react'
import { useTaskWebSocket } from '@/hooks/useTaskWebSocket'
import { TaskEvent } from '@/lib/task-system/types'
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Zap,
  Loader2
} from 'lucide-react'

interface TaskMonitorProps {
  projectId?: string
  taskId?: string
  maxEvents?: number
}

const eventIcons: Record<string, React.ReactNode> = {
  'task:created': <Activity className="w-4 h-4 text-blue-400" />,
  'task:queued': <Clock className="w-4 h-4 text-yellow-400" />,
  'task:starting': <Zap className="w-4 h-4 text-purple-400" />,
  'task:started': <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />,
  'task:progress': <Activity className="w-4 h-4 text-green-400" />,
  'task:completed': <CheckCircle className="w-4 h-4 text-green-500" />,
  'task:failed': <XCircle className="w-4 h-4 text-red-500" />,
  'task:cancelled': <AlertCircle className="w-4 h-4 text-orange-400" />,
  'task:timeout': <Clock className="w-4 h-4 text-red-400" />
}

const eventColors: Record<string, string> = {
  'task:created': 'border-l-blue-500',
  'task:queued': 'border-l-yellow-500',
  'task:starting': 'border-l-purple-500',
  'task:started': 'border-l-cyan-500',
  'task:progress': 'border-l-green-500',
  'task:completed': 'border-l-green-600',
  'task:failed': 'border-l-red-600',
  'task:cancelled': 'border-l-orange-500',
  'task:timeout': 'border-l-red-500'
}

export function TaskMonitor({ projectId, taskId, maxEvents = 50 }: TaskMonitorProps) {
  const [displayEvents, setDisplayEvents] = useState<TaskEvent[]>([])
  
  const { connected, events, clearEvents } = useTaskWebSocket({
    projectId,
    taskId,
    onEvent: (event) => {
      console.log('[TaskMonitor] Event:', event.type, event.taskId)
    }
  })

  // Update display events
  useEffect(() => {
    if (events.length > 0) {
      setDisplayEvents(prev => {
        const combined = [...prev, ...events]
        // Keep only last maxEvents
        return combined.slice(-maxEvents)
      })
    }
  }, [events, maxEvents])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getEventDescription = (event: TaskEvent): string => {
    switch (event.type) {
      case 'task:created':
        return 'Task created'
      case 'task:queued':
        return 'Task queued'
      case 'task:starting':
        return 'Starting task...'
      case 'task:started':
        return 'Task started'
      case 'task:progress':
        return event.data?.message || `Progress: ${event.data?.percentage}%`
      case 'task:completed':
        return 'Task completed successfully'
      case 'task:failed':
        return `Failed: ${event.data?.error || 'Unknown error'}`
      case 'task:cancelled':
        return 'Task cancelled'
      case 'task:timeout':
        return 'Task timed out'
      default:
        return event.type
    }
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-400">
            {connected ? 'Live' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {displayEvents.length} events
          </span>
          <button
            onClick={clearEvents}
            className="text-xs text-neon-cyan hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {displayEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No events yet</p>
            <p className="text-xs text-gray-600">
              {connected ? 'Waiting for task activity...' : 'Connect to see live updates'}
            </p>
          </div>
        ) : (
          displayEvents.map((event, index) => (
            <div
              key={`${event.taskId}-${index}`}
              className={`
                flex items-start gap-3 p-3 rounded-lg
                bg-black/40 border border-white/5
                border-l-4 ${eventColors[event.type] || 'border-l-gray-500'}
                transition-all hover:bg-black/60
              `}
            >
              <div className="mt-0.5">
                {eventIcons[event.type] || <Activity className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200">
                  {getEventDescription(event)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-neon-cyan font-mono">
                    {event.taskId.slice(-8)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                {event.data?.percentage !== undefined && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neon-cyan to-purple-500 transition-all duration-300"
                        style={{ width: `${event.data.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )).reverse()
        )}
      </div>
    </div>
  )
}

export default TaskMonitor
