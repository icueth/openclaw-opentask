'use client'

import { useState } from 'react'
import GlassCard from './GlassCard'
import NeonButton from './NeonButton'
import { Users, Split, MessageSquare, Eye, Loader2 } from 'lucide-react'

interface WorkerPoolButtonProps {
  taskId: string
  projectId: string
  onPoolCreated?: (data: any) => void
}

export default function WorkerPoolButton({ taskId, projectId, onPoolCreated }: WorkerPoolButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [workerCount, setWorkerCount] = useState(3)
  const [strategy, setStrategy] = useState<'split' | 'collaborative' | 'review'>('collaborative')
  const [loading, setLoading] = useState(false)

  const handleCreatePool = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/worker-pool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerCount,
          strategy
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setShowDialog(false)
        onPoolCreated?.(data)
      } else {
        alert(data.error || 'Failed to create worker pool')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create worker pool')
    } finally {
      setLoading(false)
    }
  }

  const strategies = [
    {
      id: 'split',
      name: 'Split Work',
      icon: Split,
      description: 'Divide task into parts, each worker does different portion'
    },
    {
      id: 'collaborative',
      name: 'Collaborative',
      icon: MessageSquare,
      description: 'All workers work together, communicating via shared context'
    },
    {
      id: 'review',
      name: 'Review Mode',
      icon: Eye,
      description: 'One primary worker, others review and improve'
    }
  ]

  return (
    <>
      <NeonButton
        variant="purple"
        size="sm"
        icon={<Users className="w-4 h-4" />}
        onClick={() => setShowDialog(true)}
      >
        Add Workers
      </NeonButton>

      {showDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard variant="purple" className="w-full max-w-lg p-6" cornerAccent>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-neon-purple" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Create Worker Pool</h3>
                <p className="text-xs text-gray-500">Spawn multiple agents to work together</p>
              </div>
            </div>

            {/* Worker Count */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Number of Workers
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="2"
                  max="5"
                  value={workerCount}
                  onChange={(e) => setWorkerCount(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-space-700 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:bg-neon-purple
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <span className="text-neon-purple font-mono font-bold w-8 text-center text-lg">
                  {workerCount}
                </span>
              </div>
            </div>

            {/* Strategy Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Work Strategy
              </label>
              <div className="space-y-2">
                {strategies.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStrategy(s.id as any)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      strategy === s.id
                        ? 'border-neon-purple bg-neon-purple/10'
                        : 'border-space-600/50 hover:border-neon-purple/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <s.icon className={`w-5 h-5 ${strategy === s.id ? 'text-neon-purple' : 'text-gray-500'}`} />
                      <div>
                        <div className={`font-medium ${strategy === s.id ? 'text-white' : 'text-gray-300'}`}>
                          {s.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {s.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="p-3 rounded-lg bg-space-800/50 border border-neon-purple/20 mb-6">
              <p className="text-xs text-gray-400">
                <strong className="text-neon-purple">How it works:</strong> Workers will communicate 
                through <code className="text-neon-cyan">SHARED_CONTEXT.md</code> in your project folder. 
                Check this file to see progress and messages between workers.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 px-4 py-3 text-gray-400 hover:text-white hover:bg-space-700/50 
                  rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePool}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-neon-purple to-neon-pink 
                  text-white rounded-xl font-medium
                  hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Create {workerCount} Workers
                  </>
                )}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </>
  )
}