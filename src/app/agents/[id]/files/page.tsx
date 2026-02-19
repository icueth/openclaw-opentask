'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import { 
  ArrowLeft, Save, RefreshCw, AlertCircle, X, 
  FileText, RotateCcw, CheckCircle
} from 'lucide-react'

export default function WorkspaceFileEditPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const agentId = decodeURIComponent(params.id as string)
  const fileName = decodeURIComponent(searchParams.get('file') || '')

  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const fetchFileContent = useCallback(async () => {
    if (!fileName) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/files/${encodeURIComponent(fileName)}`)
      const data = await res.json()
      
      if (data.success) {
        setContent(data.content || '')
        setOriginalContent(data.content || '')
      } else {
        showMessage('error', data.error || 'Failed to load file')
      }
    } catch (error) {
      console.error('Failed to load file:', error)
      showMessage('error', 'Failed to load file')
    } finally {
      setLoading(false)
    }
  }, [agentId, fileName])

  useEffect(() => {
    fetchFileContent()
  }, [fetchFileContent])

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/files/${encodeURIComponent(fileName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setOriginalContent(content)
        setIsEditing(false)
        showMessage('success', `${fileName} saved successfully`)
      } else {
        showMessage('error', data.error || 'Failed to save file')
      }
    } catch (error) {
      console.error('Failed to save file:', error)
      showMessage('error', 'Failed to save file')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setContent(originalContent)
    setIsEditing(false)
  }

  if (!fileName) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <GlassCard className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No file specified</p>
            <Link href={`/agents/${encodeURIComponent(agentId)}`} className="text-neon-cyan hover:underline mt-4 inline-block">
              ← Back to Agent
            </Link>
          </GlassCard>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-space-800/80 backdrop-blur-xl border-b border-neon-cyan/10 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/agents/${encodeURIComponent(agentId)}`}>
              <button className="p-2 text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{fileName}</h1>
                <p className="text-xs text-gray-500 font-mono">Agent: {agentId}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <NeonButton
                variant="outline"
                onClick={() => setIsEditing(true)}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Edit
              </NeonButton>
            ) : (
              <>
                <NeonButton
                  variant="outline"
                  onClick={handleCancel}
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Cancel
                </NeonButton>
                <NeonButton
                  variant="cyan"
                  onClick={handleSave}
                  loading={saving}
                  disabled={saving}
                  icon={<Save className="w-4 h-4" />}
                >
                  {saving ? 'Saving...' : 'Save'}
                </NeonButton>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Message */}
        {message && (
          <GlassCard
            variant={message.type === 'success' ? 'green' : 'pink'}
            className="mb-6 p-4 flex items-center gap-3"
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-neon-green" />
            ) : (
              <AlertCircle className="w-5 h-5 text-neon-red" />
            )}
            <span className={message.type === 'success' ? 'text-neon-green' : 'text-neon-red'}>
              {message.text}
            </span>
            <button onClick={() => setMessage(null)} className="ml-auto text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </GlassCard>
        )}

        {/* Editor */}
        <GlassCard variant="cyan" className="min-h-[600px] flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center flex-1 py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
            </div>
          ) : isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 min-h-[600px] bg-space-900/50 border-0 p-6 text-gray-300 font-mono text-sm resize-none focus:outline-none focus:ring-0"
              spellCheck={false}
            />
          ) : (
            <div className="flex-1 min-h-[600px] bg-space-900/30 p-6 overflow-auto">
              <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
                {content || (
                  <span className="text-gray-600 italic">File is empty...</span>
                )}
              </pre>
            </div>
          )}
          
          {/* Footer */}
          <div className="px-6 py-3 border-t border-neon-cyan/10 flex items-center justify-between text-xs text-gray-500 font-mono">
            <span>{content.length} characters</span>
            <span>{content.split('\n').length} lines</span>
            <span>{isEditing ? 'EDITING' : 'READ-ONLY'}</span>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  )
}
