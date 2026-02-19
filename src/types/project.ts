// Project Types

export interface Project {
  id: string
  name: string
  description: string
  path: string
  status: 'active' | 'archived' | 'completed'
  createdAt: string
  updatedAt: string
  agentId?: string
}

export interface CreateProjectData {
  name: string
  description?: string
  agentId?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  status?: 'active' | 'archived' | 'completed'
  agentId?: string
}
