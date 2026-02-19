'use client'

import { useState, useEffect, useCallback } from 'react'

export interface InitTaskInfo {
  id: string
  title: string
  message: string
}

export interface Project {
  id: string
  name: string
  description?: string
  agentId?: string
  workspace?: string
  agents?: string[]
  createdAt?: string
  updatedAt?: string
  files?: string[]
  hasProjectMd?: boolean
  hasMemoryMd?: boolean
  initTask?: InitTaskInfo
}

interface UseProjectsOptions {
  pollInterval?: number
  autoStart?: boolean
}

interface UseProjectsReturn {
  projects: Project[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createProject: (data: CreateProjectData) => Promise<Project | null>
  updateProject: (id: string, data: Partial<Project>) => Promise<boolean>
  deleteProject: (id: string) => Promise<boolean>
  getProject: (id: string) => Promise<Project | null>
}

interface CreateProjectData {
  name: string
  description?: string
  id?: string
  agentId?: string
  githubUrl?: string
}

export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const { pollInterval = 10000, autoStart = true } = options
  
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await fetch('/api/projects')
      const data = await res.json()
      
      if (data.success) {
        setProjects(data.projects || [])
      } else {
        setError(data.error || 'Failed to fetch projects')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }, [])

  const createProject = async (data: CreateProjectData): Promise<Project | null> => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await res.json()
      
      if (result.success) {
        setProjects(prev => [result.project, ...prev])
        return result.project
      } else {
        setError(result.error || 'Failed to create project')
        return null
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create project')
      return null
    }
  }

  const updateProject = async (id: string, data: Partial<Project>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await res.json()
      
      if (result.success) {
        setProjects(prev => prev.map(p => 
          p.id === id ? { ...p, ...data } : p
        ))
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      const result = await res.json()
      
      if (result.success) {
        setProjects(prev => prev.filter(p => p.id !== id))
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }

  const getProject = async (id: string): Promise<Project | null> => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      const result = await res.json()
      
      if (result.success) {
        return result.project
      }
      return null
    } catch (err) {
      return null
    }
  }

  useEffect(() => {
    if (autoStart) {
      fetchProjects()
    }
  }, [fetchProjects, autoStart])

  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return
    
    const interval = setInterval(fetchProjects, pollInterval)
    return () => clearInterval(interval)
  }, [fetchProjects, pollInterval])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProject
  }
}

export default useProjects
