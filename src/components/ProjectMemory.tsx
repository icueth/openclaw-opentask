'use client'

import { useState } from 'react'
import { Save, Edit3, X, FileText, AlertCircle, Terminal, Cpu } from 'lucide-react'
import GlassCard from './GlassCard'
import NeonButton from './NeonButton'
import HolographicText from './HolographicText'

interface ProjectMemoryProps {
  projectId: string
  initialContent?: string
  onSave?: (content: string) => Promise<void>
  readOnly?: boolean
}

export default function ProjectMemory({ 
  projectId, 
  initialContent = '', 
  onSave,
  readOnly = false 
}: ProjectMemoryProps) {
  const [content, setContent] = useState(initialContent)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async () => {
    if (!onSave) return
    
    setIsSaving(true)
    setMessage(null)
    
    try {
      await onSave(content)
      setMessage({ type: 'success', text: 'Memory saved successfully' })
      setIsEditing(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save memory' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setContent(initialContent)
    setIsEditing(false)
    setMessage(null)
  }

  return (
    <GlassCard variant="purple" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neon-purple/10 bg-gradient-to-r from-neon-purple/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-neon-purple" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-neon-purple font-semibold">MEMORY.md</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-purple/10 text-neon-purple/70 font-mono">SYS</span>
            </div>
            <span className="text-xs text-gray-500">Project Memory // {projectId}</span>
          </div>
        </div>
        
        {!readOnly && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <NeonButton variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-3.5 h-3.5" />
                </NeonButton>
                <NeonButton 
                  variant="purple" 
                  size="sm" 
                  onClick={handleSave}
                  loading={isSaving}
                  icon={<Save className="w-3.5 h-3.5" />}
                >
                  Save
                </NeonButton>
              </>
            ) : (
              <NeonButton 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                icon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit
              </NeonButton>
            )}
          </div>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div className={`flex items-center gap-2 px-5 py-2 text-sm font-mono ${
          message.type === 'success' 
            ? 'bg-neon-green/10 text-neon-green border-b border-neon-green/20' 
            : 'bg-neon-red/10 text-neon-red border-b border-neon-red/20'
        }`}>
          <AlertCircle className="w-4 h-4" />
          {message.text}
        </div>
      )}

      {/* Content */}
      <div className="p-0">
        {isEditing ? (
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-space-900/50 border-r border-neon-purple/10 flex flex-col items-center py-3 text-xs text-gray-600 font-mono">
              {Array.from({ length: 20 }).map((_, i) => (
                <span key={i} className="leading-6">{i + 1}</span>
              ))}
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full min-h-[300px] p-4 pl-14 bg-space-900/30 text-gray-300 font-mono text-sm resize-none focus:outline-none
                placeholder-gray-600 leading-6"
              placeholder="# Project Memory

Add important context, decisions, and notes about this project..."
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="min-h-[200px] max-h-[400px] overflow-auto p-5">
            {content ? (
              <pre className="text-sm text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">{content}</pre>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <Terminal className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-mono text-sm">No memory content initialized</p>
                {!readOnly && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-3 text-neon-purple hover:text-neon-pink text-sm font-mono transition-colors"
                  >
                    [ Initialize Memory ]
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-5 py-2 border-t border-neon-purple/10 bg-space-900/30 flex items-center justify-between text-[10px] text-gray-600 font-mono">
        <span>UTF-8</span>
        <span>{content.length} chars</span>
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          ACTIVE
        </span>
      </div>
    </GlassCard>
  )
}
