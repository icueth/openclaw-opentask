/**
 * React Hook for Task System v2 WebSocket
 * Provides real-time updates from the task system
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { TaskEvent } from '@/lib/task-system/types'

interface UseTaskWebSocketOptions {
  projectId?: string
  taskId?: string
  onEvent?: (event: TaskEvent) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

interface UseTaskWebSocketReturn {
  connected: boolean
  events: TaskEvent[]
  send: (message: any) => void
  clearEvents: () => void
}

export function useTaskWebSocket(options: UseTaskWebSocketOptions = {}): UseTaskWebSocketReturn {
  const {
    projectId,
    taskId,
    onEvent,
    onConnect,
    onDisconnect,
    onError
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<TaskEvent[]>([])
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  // Connect to WebSocket
  useEffect(() => {
    const connect = () => {
      // Use port 3001 for WebSocket server
      const wsUrl = `ws://${window.location.hostname}:3001`
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WebSocket] Connected')
        setConnected(true)
        onConnect?.()

        // Subscribe to project if specified
        if (projectId) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            projectId
          }))
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'event' && data.event) {
            const taskEvent = data.event as TaskEvent
            
            // Filter by task ID if specified
            if (taskId && taskEvent.taskId !== taskId) {
              return
            }
            
            setEvents(prev => [...prev, taskEvent])
            onEvent?.(taskEvent)
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error)
        }
      }

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected')
        setConnected(false)
        onDisconnect?.()

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WebSocket] Reconnecting...')
          connect()
        }, 3000)
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        onError?.(error)
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [projectId, taskId, onConnect, onDisconnect, onError])

  // Send message
  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return {
    connected,
    events,
    send,
    clearEvents
  }
}

export default useTaskWebSocket
