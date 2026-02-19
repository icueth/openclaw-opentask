'use client'

import { useState } from 'react'
import { Task } from '@/types/task'
import GlassCard from './GlassCard'
import { 
  CheckCircle2, FileText, Download, Copy, Check,
  AlertCircle, Terminal, FileCode, Image, File
} from 'lucide-react'

interface TaskResultViewerProps {
  task: Task
}

export default function TaskResultViewer({ task }: TaskResultViewerProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'result' | 'artifacts' | 'history'>('result')

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getArtifactIcon = (path: string) => {
    if (path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return <Image className="w-4 h-4" />
    if (path.match(/\.(js|ts|tsx|jsx|py|java|go|rs|cpp|c|h)$/i)) return <FileCode className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const getArtifactName = (path: string) => {
    return path.split('/').pop() || path
  }

  if (task.status !== 'completed' && task.status !== 'failed') {
    return (
      <GlassCard className="p-8 text-center">
        <Terminal className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-400">No Results Yet</h3>
        <p className="text-gray-500 mt-2">
          Task is currently <span className="text-neon-cyan">{task.status}</span>. 
          Results will appear here when complete.
        </p>
      </GlassCard>
    )
  }

  const isFailed = task.status === 'failed'

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-space-600/30">
        <button
          onClick={() => setActiveTab('result')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'result'
              ? 'border-neon-cyan text-neon-cyan'
              : 'border-transparent text-gray-500 hover:text-gray-400'
          }`}
        >
          {isFailed ? 'Error' : 'Result'}
        </button>
        {task.artifacts && task.artifacts.length > 0 && (
          <button
            onClick={() => setActiveTab('artifacts')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'artifacts'
                ? 'border-neon-cyan text-neon-cyan'
                : 'border-transparent text-gray-500 hover:text-gray-400'
            }`}
          >
            Artifacts ({task.artifacts.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-neon-cyan text-neon-cyan'
              : 'border-transparent text-gray-500 hover:text-gray-400'
          }`}
        >
          History
        </button>
      </div>

      {/* Result Tab */}
      {activeTab === 'result' && (
        <GlassCard 
          variant={isFailed ? 'default' : 'green'} 
          className="overflow-hidden"
        >
          {/* Header */}
          <div className={`
            flex items-center justify-between px-4 py-3 border-b
            ${isFailed ? 'bg-neon-red/10 border-neon-red/30' : 'bg-neon-green/10 border-neon-green/30'}
          `}>
            <div className="flex items-center gap-2">
              {isFailed ? (
                <AlertCircle className="w-5 h-5 text-neon-red" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-neon-green" />
              )}
              <span className={`font-medium ${isFailed ? 'text-neon-red' : 'text-neon-green'}`}>
                {isFailed ? 'Task Failed' : 'Task Completed Successfully'}
              </span>
            </div>
            {task.result && (
              <button
                onClick={() => copyToClipboard(task.result || '')}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-neon-cyan 
                  hover:bg-neon-cyan/10 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {isFailed ? (
              <div className="text-neon-red/90 font-mono text-sm whitespace-pre-wrap">
                {task.error || 'Unknown error occurred'}
              </div>
            ) : task.result ? (
              <div className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                {task.result}
              </div>
            ) : (
              <p className="text-gray-500 italic">No result data available</p>
            )}
          </div>

          {/* Footer - Timestamps */}
          <div className="px-4 py-2 bg-space-800/30 border-t border-space-600/30 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              {task.startedAt && (
                <span>Started: {new Date(task.startedAt).toLocaleString()}</span>
              )}
              {task.completedAt && (
                <span>Completed: {new Date(task.completedAt).toLocaleString()}</span>
              )}
            </div>
            {task.startedAt && task.completedAt && (
              <div className="mt-1 text-neon-cyan/70">
                Duration: {Math.round((new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()) / 1000)}s
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Artifacts Tab */}
      {activeTab === 'artifacts' && task.artifacts && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-neon-cyan" />
            Generated Artifacts
          </h3>
          <div className="space-y-2">
            {task.artifacts.map((artifact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg 
                  bg-space-800/50 border border-space-600/50
                  hover:border-neon-cyan/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan">
                    {getArtifactIcon(artifact)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">
                      {getArtifactName(artifact)}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[300px]">
                      {artifact}
                    </p>
                  </div>
                </div>
                <a
                  href={`/api/artifacts?path=${encodeURIComponent(artifact)}`}
                  download
                  className="p-2 text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 
                    rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Status History</h3>
          <div className="space-y-3">
            {task.statusHistory.map((entry, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-space-800/30"
              >
                <div className={`
                  w-2 h-2 rounded-full mt-1.5
                  ${entry.status === 'completed' ? 'bg-neon-green' :
                    entry.status === 'failed' ? 'bg-neon-red' :
                    entry.status === 'processing' ? 'bg-neon-purple' :
                    entry.status === 'active' ? 'bg-neon-blue' :
                    entry.status === 'pending' ? 'bg-yellow-400' :
                    'bg-gray-400'}
                `} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`
                      text-sm font-medium capitalize
                      ${entry.status === 'completed' ? 'text-neon-green' :
                        entry.status === 'failed' ? 'text-neon-red' :
                        entry.status === 'processing' ? 'text-neon-purple' :
                        entry.status === 'active' ? 'text-neon-blue' :
                        entry.status === 'pending' ? 'text-yellow-400' :
                        'text-gray-400'}
                    `}>
                      {entry.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {entry.message && (
                    <p className="text-xs text-gray-500 mt-1">{entry.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
