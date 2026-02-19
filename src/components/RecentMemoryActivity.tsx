'use client'

import { useState, useEffect } from 'react'
import GlassCard from './GlassCard'
import { BookOpen, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface MemoryActivity {
  timestamp: string
  taskTitle: string
  agentName: string
  agentId: string
  status: 'completed' | 'failed'
  summary: string
}

interface RecentMemoryActivityProps {
  projectId: string
}

export default function RecentMemoryActivity({ projectId }: RecentMemoryActivityProps) {
  const [activities, setActivities] = useState<MemoryActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMemoryActivity()
  }, [projectId])

  const fetchMemoryActivity = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${projectId}/memory`)
      const data = await res.json()
      
      if (data.success && data.memory) {
        const parsed = parseMemoryEntries(data.memory)
        setActivities(parsed.slice(0, 5)) // Show only 5 most recent
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const parseMemoryEntries = (memory: string): MemoryActivity[] => {
    const entries: MemoryActivity[] = []
    
    // Parse entries from markdown
    // Look for ### headers with dates
    const entryRegex = /###\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+-\s+Task:\s+(.+?)\n/g
    
    let match
    while ((match = entryRegex.exec(memory)) !== null) {
      const timestamp = match[1]
      const taskTitle = match[2].trim()
      
      // Extract the full entry block (until next ### or end)
      const startIdx = match.index
      const nextMatchIndex = memory.indexOf('###', startIdx + 1)
      const endIdx = nextMatchIndex > 0 ? nextMatchIndex : memory.length
      
      const entryBlock = memory.substring(startIdx, endIdx)
      
      // Parse status
      const statusMatch = entryBlock.match(/\*\*Status:\*\*\s+(✅\s+Completed|❌\s+Failed)/)
      const status = statusMatch?.[1].includes('Completed') ? 'completed' : 'failed'
      
      // Parse agent
      const agentMatch = entryBlock.match(/\*\*Agent:\*\*\s+(.+?)\s+\(/)
      const agentName = agentMatch?.[1] || 'Unknown'
      
      // Parse agent ID
      const agentIdMatch = entryBlock.match(/\(([^)]+)\)/)
      const agentId = agentIdMatch?.[1] || 'unknown'
      
      // Parse summary
      const summaryMatch = entryBlock.match(/\*\*Summary:\*\*\n([\s\S]*?)(?:\n\n\*\*Key Points|\n\n---)/)
      const summary = summaryMatch?.[1]?.trim().substring(0, 100) + '...' || 'Task completed'
      
      entries.push({
        timestamp,
        taskTitle,
        agentName,
        agentId,
        status: status as 'completed' | 'failed',
        summary
      })
    }
    
    return entries
  }

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp.replace(' ', 'T'))
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timestamp
    }
  }

  if (loading) {
    return (
      <GlassCard className="p-4" hover={false}>
        <div className="flex items-center gap-2 text-gray-400">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm">Loading recent activity...</span>
        </div>
      </GlassCard>
    )
  }

  if (error || activities.length === 0) {
    return (
      <GlassCard className="p-4" hover={false}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-gray-300">
            <BookOpen className="w-4 h-4 text-neon-cyan" />
            <span className="font-medium">Recent Activity</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {error ? 'Failed to load activity' : 'No recent activity recorded. Complete tasks to see them here.'}
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-4" hover={false}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-200">
          <BookOpen className="w-5 h-5 text-neon-cyan" />
          <span className="font-medium">Recent Activity (from MEMORY.md)</span>
        </div>
        <Link 
          href={`/projects/${projectId}?tab=memory`}
          className="text-xs text-neon-cyan hover:text-neon-purple transition-colors flex items-center gap-1"
        >
          View Full Memory
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 p-3 bg-space-800/50 rounded-lg border border-space-600/30
              hover:border-neon-cyan/30 transition-colors"
          >
            {/* Status Icon */}
            <div className={`mt-0.5 ${
              activity.status === 'completed' 
                ? 'text-neon-green' 
                : 'text-neon-red'
            }`}>
              {activity.status === 'completed' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-neon-cyan font-mono">
                  {formatTime(activity.timestamp)}
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-400">
                  {activity.taskTitle}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-neon-purple">
                  {activity.agentName}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  activity.status === 'completed'
                    ? 'bg-neon-green/10 text-neon-green'
                    : 'bg-neon-red/10 text-neon-red'
                }`}>
                  {activity.status === 'completed' ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
