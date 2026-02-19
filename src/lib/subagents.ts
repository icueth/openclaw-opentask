/**
 * Simple in-memory store for tracking subagents
 * In production, this could be backed by Redis or a database
 */

export interface Subagent {
  id: string
  parentAgentId: string
  task: string
  status: 'spawning' | 'running' | 'completed' | 'failed'
  createdAt: string
  updatedAt?: string
  completedAt?: string
  sessionKey?: string
  result?: string
  error?: string
}

class SubagentStore {
  private subagents: Map<string, Subagent> = new Map()

  add(subagent: Subagent): Subagent {
    this.subagents.set(subagent.id, subagent)
    return subagent
  }

  get(id: string): Subagent | undefined {
    return this.subagents.get(id)
  }

  getByParentId(parentAgentId: string): Subagent[] {
    return Array.from(this.subagents.values())
      .filter(s => s.parentAgentId === parentAgentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  getAll(): Subagent[] {
    return Array.from(this.subagents.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  update(id: string, updates: Partial<Subagent>): Subagent | undefined {
    const existing = this.subagents.get(id)
    if (!existing) return undefined
    
    const updated = { 
      ...existing, 
      ...updates,
      updatedAt: new Date().toISOString()
    }
    this.subagents.set(id, updated)
    return updated
  }

  complete(id: string, result: string): Subagent | undefined {
    return this.update(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      result
    })
  }

  fail(id: string, error: string): Subagent | undefined {
    return this.update(id, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      error
    })
  }

  delete(id: string): boolean {
    return this.subagents.delete(id)
  }

  clear(): void {
    this.subagents.clear()
  }

  // Clean up old completed/failed subagents (older than 24 hours)
  cleanup(): number {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    let count = 0
    
    for (const [id, subagent] of this.subagents.entries()) {
      if (subagent.status === 'completed' || subagent.status === 'failed') {
        const completedAt = subagent.completedAt 
          ? new Date(subagent.completedAt)
          : new Date(subagent.createdAt)
        
        if (completedAt < cutoff) {
          this.subagents.delete(id)
          count++
        }
      }
    }
    
    return count
  }
}

// Singleton instance
export const subagents = new SubagentStore()

export default subagents
