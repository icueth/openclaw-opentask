'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import HolographicText from '@/components/HolographicText'
import { useProjects } from '@/hooks/useProjects'
import { 
  ArrowLeft, FolderPlus, AlertCircle, Sparkles, 
  FileText, CheckCircle, Github, Lightbulb,
  Rocket, ExternalLink
} from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const { createProject } = useProjects()
  
  const [name, setName] = useState('')
  const [id, setId] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)
  const [createdProject, setCreatedProject] = useState<any>(null)
  const [githubUrl, setGithubUrl] = useState('')
  const [githubError, setGithubError] = useState<string | null>(null)

  const generateId = (projectName: string) => {
    return projectName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!id || id === generateId(name)) {
      setId(generateId(value))
    }
  }

  // Validate GitHub URL format
  const validateGithubUrl = (url: string): boolean => {
    if (!url) return true // Empty is valid (optional field)
    const regex = /^https:\/\/github\.com\/[a-zA-Z0-9-_.]+\/[a-zA-Z0-9-_.]+(\/)?(\.git)?$/
    return regex.test(url.trim())
  }

  // Get repo name preview from GitHub URL
  const getRepoNamePreview = (url: string): string | null => {
    if (!url || !validateGithubUrl(url)) return null
    const match = url.match(/github\.com\/[^/]+\/([^/]+)/)
    return match ? match[1].replace(/\.git$/, '') : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setGithubError(null)

    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    if (!id.trim()) {
      setError('Project ID is required')
      return
    }

    if (!/^[a-z0-9-]+$/.test(id)) {
      setError('Project ID must be lowercase alphanumeric with hyphens only')
      return
    }

    // Validate GitHub URL if provided
    if (githubUrl && !validateGithubUrl(githubUrl)) {
      setGithubError('Invalid GitHub URL format. Expected: https://github.com/username/repo')
      return
    }

    setLoading(true)

    const project = await createProject({
      name: name.trim(),
      description: description.trim(),
      id: id.trim(),
      githubUrl: githubUrl.trim() || undefined
    })

    setLoading(false)

    if (project) {
      setCreatedProject(project)
      setCreated(true)
      
      // If there's an init task, redirect to task view after a delay
      // Otherwise redirect to project view
      const initTaskId = project.initTask?.id
      setTimeout(() => {
        if (initTaskId) {
          router.push(`/projects/${project.id}/tasks/${initTaskId}`)
        } else {
          router.push(`/projects/${project.id}`)
        }
      }, 2500)
    }
  }

  const repoPreview = getRepoNamePreview(githubUrl)

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 
        bg-space-800/80 backdrop-blur-xl
        border-b border-neon-cyan/10 
        px-8 py-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/projects"
            className="p-2 text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <HolographicText size="xl" variant="multi">New Project</HolographicText>
            <p className="text-sm text-gray-500 font-mono">
              Create a new workspace with PROJECT.md and MEMORY.md
            </p>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-3xl mx-auto">
        {created ? (
          <GlassCard variant="cyan" className="p-8 text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-green/20 border border-neon-green/50 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-neon-green" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Project Created!</h2>
            
            {createdProject?.initTask?.id ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-neon-cyan">
                  <Rocket className="w-5 h-5" />
                  <span className="font-medium">Init Analysis Task Created</span>
                </div>
                <p className="text-gray-400 text-sm">
                  An initialization task has been queued to analyze the project structure and create baseline documentation.
                </p>
                <GlassCard variant="default" className="p-4 mx-auto max-w-md" hover={false}>
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🔍</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {createdProject.initTask.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Analyzing project structure...
                      </p>
                    </div>
                    <Link 
                      href={`/projects/${createdProject.id}/tasks/${createdProject.initTask.id}`}
                      className="p-2 text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </GlassCard>
                <p className="text-xs text-gray-500">
                  Redirecting to task view...
                </p>
              </div>
            ) : (
              <p className="text-gray-400 mb-6">Redirecting to project overview...</p>
            )}
          </GlassCard>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error */}
            {error && (
              <GlassCard 
                variant="pink"
                className="p-4 flex items-center gap-3"
                hover={false}
              >
                <AlertCircle className="w-5 h-5 text-neon-red flex-shrink-0" />
                <span className="font-mono text-sm text-neon-red">{error}</span>
              </GlassCard>
            )}

            {/* Name */}
            <GlassCard className="p-6" cornerAccent>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Sparkles className="w-4 h-4 text-neon-cyan" />
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="My Awesome Project"
                  autoFocus
                  className="w-full px-4 py-3 bg-space-800/50 border border-space-600/50 rounded-xl
                    text-gray-200 placeholder-gray-600
                    focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30
                    transition-all"
                />
                <p className="text-xs text-gray-500">
                  A friendly name for your project
                </p>
              </div>
            </GlassCard>

            {/* ID */}
            <GlassCard className="p-6" cornerAccent>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <FileText className="w-4 h-4 text-neon-purple" />
                  Project ID *
                </label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-awesome-project"
                  className="w-full px-4 py-3 bg-space-800/50 border border-space-600/50 rounded-xl
                    text-gray-200 placeholder-gray-600 font-mono
                    focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30
                    transition-all"
                />
                <p className="text-xs text-gray-500">
                  Used in URLs and folder names. Lowercase letters, numbers, and hyphens only.
                </p>
              </div>
            </GlassCard>

            {/* GitHub Repository */}
            <GlassCard className="p-6" cornerAccent>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Github className="w-4 h-4 text-neon-purple" />
                  GitHub Repository <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => {
                    setGithubUrl(e.target.value)
                    setGithubError(null)
                  }}
                  placeholder="https://github.com/username/repo-name"
                  className="w-full px-4 py-3 bg-space-800/50 border border-space-600/50 rounded-xl
                    text-gray-200 placeholder-gray-600
                    focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30
                    transition-all"
                />
                {githubError && (
                  <p className="text-xs text-neon-red flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {githubError}
                  </p>
                )}
                {repoPreview && !githubError && (
                  <p className="text-xs text-neon-green flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Will clone: <span className="font-mono">{repoPreview}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  Leave empty to create a blank project
                </p>
              </div>
            </GlassCard>

            {/* Description */}
            <GlassCard className="p-6" cornerAccent>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <FileText className="w-4 h-4 text-neon-pink" />
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this project is about..."
                  rows={4}
                  className="w-full px-4 py-3 bg-space-800/50 border border-space-600/50 rounded-xl
                    text-gray-200 placeholder-gray-600 resize-none
                    focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30
                    transition-all"
                />
              </div>
            </GlassCard>

            {/* Info Card */}
            <GlassCard variant="default" className="p-4" hover={false}>
              <div className="flex items-start gap-3 text-sm text-gray-400">
                <FolderPlus className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>Creating a project will:</p>
                  <ul className="list-disc list-inside text-gray-500 space-y-1">
                    <li>Create a project folder in the agent&apos;s workspace</li>
                    <li>Generate <code className="text-neon-cyan/70">PROJECT.md</code> with project info</li>
                    <li>Generate <code className="text-neon-cyan/70">MEMORY.md</code> for shared context</li>
                    <li>Generate <code className="text-neon-cyan/70">TASKS.md</code> for task tracking</li>
                    {githubUrl && validateGithubUrl(githubUrl) && (
                      <li className="text-neon-purple">
                        <Github className="w-3 h-3 inline mr-1" />
                        Clone repository from GitHub
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </GlassCard>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/projects">
                <NeonButton type="button" variant="outline">
                  Cancel
                </NeonButton>
              </Link>
              <NeonButton
                type="submit"
                variant="cyan"
                loading={loading}
                disabled={loading || !name.trim()}
                icon={<FolderPlus className="w-4 h-4" />}
              >
                Create Project
              </NeonButton>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}