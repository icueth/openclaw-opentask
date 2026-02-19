/** Agent Types */

export type AgentStatus = 'active' | 'inactive'

export interface Agent {
  id: string
  name: string
  emoji: string
  model: string
  description?: string
  workspace: string
  agentDir: string
  status: AgentStatus
  isDefault?: boolean
  createdAt: string
  updatedAt: string
  tasksCompleted: number
}

export interface CreateAgentData {
  id: string
  name: string
  emoji: string
  model: string
  description?: string
}

export interface UpdateAgentData {
  name?: string
  emoji?: string
  model?: string
  description?: string
}

export interface AgentConfigFile {
  id: string
  name: string
  default?: boolean
  model?: string
  workspace: string
  agentDir: string
}

export interface OpenClawConfig {
  agents?: {
    list?: AgentConfigFile[]
    defaults?: {
      model?: {
        primary?: string
      }
    }
  }
}

export interface AgentFileTemplates {
  soul: string
  identity: string
  agents: string
  memory: string
  tools: string
  heartbeat: string
  user: string
}
