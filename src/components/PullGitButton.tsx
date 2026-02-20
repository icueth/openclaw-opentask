'use client'

import { useState } from 'react'
import { GitBranch, Download, Loader2, CheckCircle } from 'lucide-react'
import NeonButton from './NeonButton'
import GlassCard from './GlassCard'

interface PullGitButtonProps {
  projectId: string
  githubUrl?: string
  onPullCreated?: () => void
}

export default function PullGitButton({ projectId, githubUrl, onPullCreated }: PullGitButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [branch, setBranch] = useState('main')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Don't show if no github url
  if (!githubUrl) {
    return null
  }

  const handlePull = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/git-pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create pull task')
      }

      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setBranch('main')
        onPullCreated?.()
      }, 1500)
    } catch (err: any) {
      alert(`Failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NeonButton
        size="sm"
        variant="purple"
        onClick={() => setIsOpen(true)}
        icon={<Download className="w-4 h-4" />}
      >
        Pull Git
      </NeonButton>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md mx-4">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neon-purple/10 rounded-lg">
                  <GitBranch className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-200">
                    Pull from Git
                  </h3>
                  <p className="text-sm text-gray-400">
                    Create a task to pull latest changes
                  </p>
                </div>
              </div>

              {success ? (
                <div className="flex items-center justify-center gap-2 py-8 text-neon-green">
                  <CheckCircle className="w-8 h-8" />
                  <span className="text-lg">Pull task created!</span>
                </div>
              ) : (
                <>
                  {/* Branch Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main, develop, feature/xxx..."
                      className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg 
                        text-gray-200 placeholder-gray-500
                        focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple"
                    />
                    <p className="text-xs text-gray-500">
                      Default: main. Enter branch name to pull from.
                    </p>
                  </div>

                  {/* Repository Info */}
                  <div className="p-3 bg-space-800/50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Repository:</p>
                    <code className="text-xs text-neon-cyan break-all">
                      {githubUrl}
                    </code>
                  </div>

                  {/* What will happen */}
                  <div className="text-sm text-gray-500 bg-space-800/30 rounded-lg p-3">
                    <p className="mb-2">This will create a task to:</p>
                    <ul className="space-y-1 ml-4">
                      <li className="flex items-center gap-2">
                        <span className="text-neon-cyan">•</span>
                        Fetch from remote
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-neon-cyan">•</span>
                        Checkout branch: <code className="text-neon-purple">{branch}</code>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-neon-cyan">•</span>
                        Pull latest changes
                      </li>
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <NeonButton
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsOpen(false)}
                      disabled={loading}
                    >
                      Cancel
                    </NeonButton>
                    <NeonButton
                      variant="purple"
                      className="flex-1"
                      onClick={handlePull}
                      loading={loading}
                      disabled={!branch.trim()}
                      icon={<Download className="w-4 h-4" />}
                    >
                      Pull Now
                    </NeonButton>
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </>
  )
}
