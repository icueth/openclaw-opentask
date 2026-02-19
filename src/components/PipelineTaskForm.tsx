'use client'

import { useState, useEffect } from 'react'
import GlassCard from './GlassCard'
import NeonButton from './NeonButton'
import { PipelineTemplate } from '@/types/pipeline'
import { GitBranch, Cpu, Users, ChevronDown } from 'lucide-react'

interface PipelineTaskFormProps {
  projectId: string
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export default function PipelineTaskForm({ projectId, onSubmit, onCancel }: PipelineTaskFormProps) {
  const [templates, setTemplates] = useState<PipelineTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [workerCount, setWorkerCount] = useState(2)
  const [loading, setLoading] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(true)

  // Fetch pipeline templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch(`/api/projects/${projectId}/pipeline-templates?templates=true`)
        const data = await res.json()
        if (data.success && data.templates) {
          setTemplates(data.templates)
          if (data.templates.length > 0) {
            setSelectedTemplate(data.templates[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setTemplatesLoading(false)
      }
    }
    fetchTemplates()
  }, [projectId])

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !selectedTemplate) return

    setLoading(true)
    try {
      await onSubmit({
        title,
        description,
        pipelineTemplate: selectedTemplate,
        workerCount
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Task Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Build e-commerce website"
          className="w-full px-4 py-3 bg-space-800/50 border border-space-600/50 rounded-xl
            text-gray-200 placeholder-gray-600
            focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30
            transition-all"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what you want to build..."
          rows={3}
          className="w-full px-4 py-3 bg-space-800/50 border border-space-600/50 rounded-xl
            text-gray-200 placeholder-gray-600
            focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30
            transition-all resize-none"
        />
      </div>

      {/* Pipeline Template Selection */}
      <GlassCard variant="cyan" className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-5 h-5 text-neon-cyan" />
          <span className="font-medium text-gray-200">Pipeline Template</span>
        </div>
        
        {templatesLoading ? (
          <div className="text-gray-500 text-sm">Loading templates...</div>
        ) : (
          <div className="space-y-3">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-2 bg-space-800/50 border border-neon-cyan/30 rounded-lg
                text-gray-200
                focus:border-neon-cyan focus:outline-none"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.steps.length} steps)
                </option>
              ))}
            </select>
            
            {selectedTemplateData && (
              <p className="text-xs text-gray-400">
                {selectedTemplateData.description}
              </p>
            )}
          </div>
        )}
      </GlassCard>

      {/* Worker Configuration */}
      {selectedTemplateData && selectedTemplateData.steps.some(s => s.type === 'worker') && (
        <GlassCard variant="purple" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-neon-purple" />
            <span className="font-medium text-gray-200">Parallel Workers</span>
          </div>
          
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
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
            <span className="text-neon-purple font-mono font-bold w-8 text-center">
              {workerCount}
            </span>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Number of agents working in parallel on the development step
          </p>
        </GlassCard>
      )}

      {/* Pipeline Preview */}
      {selectedTemplateData && (
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-5 h-5 text-neon-green" />
            <span className="font-medium text-gray-200">Pipeline Flow</span>
          </div>
          
          <div className="space-y-2">
            {selectedTemplateData.steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-space-700 border border-neon-cyan/30 
                  flex items-center justify-center text-xs text-neon-cyan">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-300">{step.name}</div>
                  <div className="text-xs text-gray-500">
                    {step.type} {step.count > 1 && `(${step.count} agents)`}
                  </div>
                </div>
                {index < selectedTemplateData.steps.length - 1 && (
                  <div className="text-gray-600">↓</div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 text-gray-400 hover:text-white hover:bg-space-700/50 
            rounded-xl transition-all font-medium"
        >
          Cancel
        </button>
        <NeonButton
          type="submit"
          variant="cyan"
          className="flex-1"
          disabled={loading || !title || !selectedTemplate}
        >
          {loading ? 'Creating...' : 'Create Pipeline Task'}
        </NeonButton>
      </div>
    </form>
  )
}