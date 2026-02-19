'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import NeonBadge from '@/components/NeonBadge'
import HolographicText from '@/components/HolographicText'
import { 
  FolderOpen, FileText, RefreshCw, Plus, Edit3, Save, 
  AlertCircle, Trash2, FolderPlus, FilePlus, ChevronRight, Users, X,
  Cpu, Database, Code, Terminal, Sparkles
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  agents?: string[]
  createdAt?: string
}

interface FileItem {
  name: string
  isDirectory: boolean
  size: number
  modified: string
}

export default function WorkspacePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [projectData, setProjectData] = useState<any>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewFile, setShowNewFile] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newFileName, setNewFileName] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function selectProject(projectId: string) {
    setSelectedProject(projectId)
    setSelectedFile(null)
    
    try {
      const [projectRes, filesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/files`)
      ])
      
      const projectData = await projectRes.json()
      const filesData = await filesRes.json()
      
      setProjectData(projectData.project)
      setFiles(filesData.files || [])
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }

  async function openFile(fileName: string) {
    if (!selectedProject) return
    
    try {
      const res = await fetch(`/api/projects/${selectedProject}/files/${encodeURIComponent(fileName)}`)
      const data = await res.json()
      
      if (data.success) {
        setSelectedFile(fileName)
        setFileContent(data.content || '')
        setEditing(false)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load file' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load file' })
    }
  }

  async function saveFile() {
    if (!selectedProject || !selectedFile) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${selectedProject}/files/${encodeURIComponent(selectedFile)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fileContent })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'File saved successfully' })
        setEditing(false)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function createProject() {
    if (!newProjectName.trim()) return
    
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, agents: ['main'] })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: `Project "${newProjectName}" created` })
        setShowNewProject(false)
        setNewProjectName('')
        fetchProjects()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  async function createFile() {
    if (!newFileName.trim() || !selectedProject) return
    
    try {
      const res = await fetch(`/api/projects/${selectedProject}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFileName, content: '' })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: `File "${newFileName}" created` })
        setShowNewFile(false)
        setNewFileName('')
        selectProject(selectedProject)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  async function deleteProject(projectId: string) {
    if (!confirm(`Delete project "${projectId}"?`)) return
    
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        if (selectedProject === projectId) {
          setSelectedProject(null)
          setFiles([])
        }
        fetchProjects()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  async function deleteFile(fileName: string) {
    if (!confirm(`Delete file "${fileName}"?`)) return
    
    try {
      const res = await fetch(`/api/projects/${selectedProject}/files/${encodeURIComponent(fileName)}`, { 
        method: 'DELETE' 
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        setSelectedFile(null)
        selectProject(selectedProject!)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 
        bg-space-800/80 backdrop-blur-xl 
        border-b border-neon-cyan/10 
        px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <Code className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <HolographicText size="xl" variant="multi">Workspace</HolographicText>
              <p className="text-sm text-gray-500 font-mono">Project & File Manager</p>
            </div>
          </div>
          <div className="flex gap-3">
            <NeonButton 
              variant="outline" 
              onClick={fetchProjects}
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </NeonButton>
            <NeonButton 
              variant="cyan" 
              onClick={() => setShowNewProject(true)}
              icon={<FolderPlus className="w-4 h-4" />}
            >
              New Project
            </NeonButton>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Message */}
        {message && (
          <GlassCard 
            variant={message.type === 'success' ? 'cyan' : 'pink'}
            className="mb-6 p-4 flex items-center gap-3"
            hover={false}
          >
            <AlertCircle className={`w-5 h-5 ${message.type === 'success' ? 'text-neon-green' : 'text-neon-red'}`} />
            <span className={`font-mono text-sm ${message.type === 'success' ? 'text-neon-green' : 'text-neon-red'}`}>
              {message.text}
            </span>
            <button onClick={() => setMessage(null)} className="ml-auto text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </GlassCard>
        )}

        <div className="flex gap-6">
          {/* Projects Sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-400 font-mono uppercase tracking-wider">
                Projects
              </h2>
              <NeonBadge variant="cyan" size="sm">{projects.length}</NeonBadge>
            </div>
            <div className="space-y-2">
              {projects.map(project => (
                <div key={project.id}
                  className={`
                    group flex items-center justify-between p-3 rounded-xl cursor-pointer 
                    transition-all duration-300 border
                    ${selectedProject === project.id 
                      ? 'bg-neon-cyan/10 border-neon-cyan/40 shadow-[0_0_15px_rgba(0,240,255,0.1)]' 
                      : 'bg-space-800/50 border-space-700 hover:border-neon-cyan/30 hover:bg-space-700/50'
                    }
                  `}
                  onClick={() => selectProject(project.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <FolderOpen className={`w-4 h-4 flex-shrink-0 ${selectedProject === project.id ? 'text-neon-cyan' : 'text-gray-500'}`} />
                    <span className="text-gray-300 truncate font-mono text-sm">{project.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {projects.length === 0 && (
                <GlassCard className="py-8 text-center" hover={false}>
                  <p className="text-gray-500 text-sm font-mono">No projects yet</p>
                </GlassCard>
              )}
            </div>
          </div>

          {/* Files Area */}
          <div className="flex-1">
            {selectedProject ? (
              <>
                {/* Project Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-white font-mono">{projectData?.name || selectedProject}</h2>
                      {projectData?.agents && (
                        <p className="text-xs text-gray-500 font-mono">{projectData.agents.length} agents assigned</p>
                      )}
                    </div>
                  </div>
                  <NeonButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowNewFile(true)}
                    icon={<FilePlus className="w-4 h-4" />}
                  >
                    New File
                  </NeonButton>
                </div>

                {/* Files Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {files.map(file => (
                    <GlassCard
                      key={file.name}
                      variant={selectedFile === file.name ? 'cyan' : 'default'}
                      className={`group cursor-pointer ${selectedFile === file.name ? 'ring-1 ring-neon-cyan/50' : ''}`}
                      hover={true}
                      onClick={() => !file.isDirectory && openFile(file.name)}
                    >
                      <div className="flex items-center gap-3 p-4">
                        <div className={`
                          p-2 rounded-lg 
                          ${file.isDirectory 
                            ? 'bg-neon-yellow/10 border border-neon-yellow/30' 
                            : 'bg-neon-cyan/10 border border-neon-cyan/30'
                          }
                        `}>
                          {file.isDirectory ? (
                            <FolderOpen className="w-5 h-5 text-neon-yellow" />
                          ) : (
                            <FileText className="w-5 h-5 text-neon-cyan" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 truncate font-mono text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{file.size} bytes</p>
                        </div>
                        {!file.isDirectory && (
                          <button onClick={(e) => { e.stopPropagation(); deleteFile(file.name); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                  {files.length === 0 && (
                    <GlassCard className="col-span-full py-12 text-center" hover={false}>
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p className="text-gray-500 font-mono">No files yet</p>
                    </GlassCard>
                  )}
                </div>

                {/* File Editor */}
                {selectedFile && (
                  <GlassCard variant="cyan" className="mb-6 overflow-hidden" cornerAccent={true}>
                    {/* Editor Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-neon-cyan/10 bg-gradient-to-r from-neon-cyan/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                          <Terminal className="w-4 h-4 text-neon-cyan" />
                        </div>
                        <span className="text-white font-mono text-sm">{selectedFile}</span>
                      </div>
                      <div className="flex gap-2">
                        {editing ? (
                          <>
                            <NeonButton variant="outline" size="sm" onClick={() => setEditing(false)}>
                              Cancel
                            </NeonButton>
                            <NeonButton 
                              variant="cyan" 
                              size="sm" 
                              onClick={saveFile}
                              loading={saving}
                              icon={<Save className="w-4 h-4" />}
                            >
                              Save
                            </NeonButton>
                          </>
                        ) : (
                          <NeonButton 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditing(true)}
                            icon={<Edit3 className="w-4 h-4" />}
                          >
                            Edit
                          </NeonButton>
                        )}
                      </div>
                    </div>
                    
                    {/* Editor Content */}
                    {editing ? (
                      <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-space-900/80 border-r border-neon-cyan/10 flex flex-col items-center py-3 text-xs text-gray-600 font-mono select-none">
                          {Array.from({ length: Math.max(20, fileContent.split('\n').length) }).map((_, i) => (
                            <span key={i} className="leading-6">{i + 1}</span>
                          ))}
                        </div>
                        <textarea 
                          value={fileContent} 
                          onChange={e => setFileContent(e.target.value)}
                          className="w-full min-h-[300px] p-4 pl-14 bg-space-900/50 text-gray-300 font-mono text-sm resize-none focus:outline-none leading-6"
                          spellCheck={false}
                        />
                      </div>
                    ) : (
                      <div className="min-h-[200px] max-h-[400px] overflow-auto p-5 bg-space-900/30">
                        {fileContent ? (
                          <pre className="text-sm text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">{fileContent}</pre>
                        ) : (
                          <p className="text-gray-600 font-mono text-center py-8">Empty file</p>
                        )}
                      </div>
                    )}
                    
                    {/* Editor Footer */}
                    <div className="px-5 py-2 border-t border-neon-cyan/10 bg-space-900/50 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                      <span>UTF-8</span>
                      <span>{fileContent.length} chars</span>
                      <span>{fileContent.split('\n').length} lines</span>
                    </div>
                  </GlassCard>
                )}

                {/* Project Agents */}
                <GlassCard className="p-5" hover={false}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                      <Users className="w-4 h-4 text-neon-green" />
                    </div>
                    <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Assigned Agents</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {projectData?.agents?.map((agent: string) => (
                      <NeonBadge key={agent} variant="green" size="md" icon={<Cpu className="w-3 h-3" />}>
                        {agent}
                      </NeonBadge>
                    ))}
                    <button className="px-3 py-1.5 text-sm text-gray-500 border border-dashed border-space-600 rounded-full hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors font-mono">
                      + Add Agent
                    </button>
                  </div>
                </GlassCard>
              </>
            ) : (
              <GlassCard className="h-96 flex flex-col items-center justify-center" hover={false}>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/20 flex items-center justify-center mb-4">
                  <FolderOpen className="w-10 h-10 text-neon-cyan/50" />
                </div>
                <p className="text-gray-500 font-mono mb-4">Select a project to view files</p>
                <NeonButton 
                  variant="cyan" 
                  onClick={() => setShowNewProject(true)}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Create First Project
                </NeonButton>
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
          <GlassCard variant="cyan" className="w-full max-w-md" cornerAccent={true}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                  <FolderPlus className="w-5 h-5 text-neon-cyan" />
                </div>
                <HolographicText size="lg">New Project</HolographicText>
              </div>
              <input 
                type="text" 
                value={newProjectName} 
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createProject()}
                placeholder="Project name" 
                autoFocus
                className="w-full px-4 py-3 bg-space-900/80 border border-space-600 rounded-lg text-white placeholder-gray-600 font-mono mb-6 focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] focus:outline-none transition-all"
              />
              <div className="flex gap-3 justify-end">
                <NeonButton variant="outline" onClick={() => { setShowNewProject(false); setNewProjectName(''); }}>
                  Cancel
                </NeonButton>
                <NeonButton variant="cyan" onClick={createProject}>
                  Create
                </NeonButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* New File Modal */}
      {showNewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
          <GlassCard variant="cyan" className="w-full max-w-md" cornerAccent={true}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                  <FilePlus className="w-5 h-5 text-neon-cyan" />
                </div>
                <HolographicText size="lg">New File</HolographicText>
              </div>
              <input 
                type="text" 
                value={newFileName} 
                onChange={e => setNewFileName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createFile()}
                placeholder="filename.md" 
                autoFocus
                className="w-full px-4 py-3 bg-space-900/80 border border-space-600 rounded-lg text-white placeholder-gray-600 font-mono mb-6 focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] focus:outline-none transition-all"
              />
              <div className="flex gap-3 justify-end">
                <NeonButton variant="outline" onClick={() => { setShowNewFile(false); setNewFileName(''); }}>
                  Cancel
                </NeonButton>
                <NeonButton variant="cyan" onClick={createFile}>
                  Create
                </NeonButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  )
}
