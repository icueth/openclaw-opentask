'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import NeonButton from '@/components/NeonButton'
import AgentCard from '@/components/AgentCard'
import CreateAgentModal from '@/components/CreateAgentModal'
import { Agent, CreateAgentData } from '@/types/agent'
import { Cpu, Plus, RefreshCw, AlertCircle, X, CheckCircle } from 'lucide-react'

export default function AgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agents')
      if (!res.ok) throw new Error('Failed to fetch agents')
      const data = await res.json()
      setAgents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      showMessage('error', 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }, [])

  const handleCreateAgent = async (data: CreateAgentData) => {
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create agent')
      }
      
      showMessage('success', `Agent "${data.name}" created successfully`)
      setIsModalOpen(false)
      fetchAgents()
      
      // Redirect to the new agent's detail page
      router.push(`/agents/${data.id}`)
    } catch (error) {
      console.error('Failed to create agent:', error)
      throw error
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-space-800/80 backdrop-blur-xl border-b border-neon-cyan/10 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                Agents
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-mono">
                {agents.length} agent{agents.length !== 1 ? 's' : ''} configured
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NeonButton
              variant="outline"
              onClick={fetchAgents}
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </NeonButton>
            <NeonButton
              variant="cyan"
              onClick={() => setIsModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Agent
            </NeonButton>
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

        {/* Agents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
          </div>
        ) : agents.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Cpu className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No agents found</p>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              Create your first agent to get started
            </p>
            <NeonButton
              variant="cyan"
              onClick={() => setIsModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Agent
            </NeonButton>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateAgent}
      />
    </DashboardLayout>
  )
}
