'use client'

import { ProgressUpdate } from '@/types/task'
import { CheckCircle, Clock } from 'lucide-react'

interface TaskProgressProps {
  progress?: number
  currentStep?: string
  progressUpdates?: ProgressUpdate[]
  status: string
}

export default function TaskProgress({
  progress,
  currentStep,
  progressUpdates = [],
  status
}: TaskProgressProps) {
  // Only show progress for active/processing tasks or if we have progress data
  const shouldShowProgress = status === 'processing' || status === 'active' || progress !== undefined
  
  if (!shouldShowProgress) {
    return null
  }

  const displayProgress = progress ?? 0
  const updates = progressUpdates || []

  // Sort updates by timestamp (newest first)
  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 5) return 'just now'
    if (diffSec < 60) return `${diffSec} sec ago`
    if (diffMin < 60) return `${diffMin} min ago`
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="font-medium text-neon-cyan">{displayProgress}%</span>
        </div>
        
        <div className="relative h-3 bg-space-800/50 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-cyan to-neon-blue rounded-full transition-all duration-500 ease-out"
            style={{ width: `${displayProgress}%` }}
          >
            {/* Animated shimmer effect */}
            {status === 'processing' && displayProgress < 100 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            )}
          </div>
          
          {/* Progress markers */}
          {[20, 40, 60, 80].map((mark) => (
            <div
              key={mark}
              className={`absolute top-0 bottom-0 w-px ${
                displayProgress >= mark ? 'bg-space-900/50' : 'bg-space-700/30'
              }`}
              style={{ left: `${mark}%` }}
            />
          ))}
        </div>
        
        {/* Marker labels */}
        <div className="flex justify-between text-xs text-gray-500">
          {[0, 20, 40, 60, 80, 100].map((mark) => (
            <span
              key={mark}
              className={displayProgress >= mark ? 'text-neon-cyan' : ''}
            >
              {mark}%
            </span>
          ))}
        </div>
      </div>

      {/* Current Step */}
      {currentStep && status === 'processing' && (
        <div className="flex items-center gap-3 p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl">
          <div className="relative">
            <div className="w-3 h-3 bg-neon-cyan rounded-full animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 bg-neon-cyan rounded-full animate-ping opacity-75" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Current Step</p>
            <p className="text-sm text-neon-cyan font-medium">{currentStep}</p>
          </div>
        </div>
      )}

      {/* Progress History */}
      {sortedUpdates.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neon-cyan" />
            Progress History
          </h4>
          
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {sortedUpdates.map((update, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-space-800/30 rounded-lg hover:bg-space-800/50 transition-colors"
              >
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  update.percentage === 100
                    ? 'bg-neon-green/20 text-neon-green'
                    : 'bg-neon-cyan/20 text-neon-cyan'
                }`}>
                  {update.percentage === 100 ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <span className="text-[10px] font-bold">{update.percentage}%</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">{update.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatRelativeTime(update.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
