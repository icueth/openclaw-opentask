/**
 * Shared Context Manager for Multi-Agent Pipeline
 * Manages SHARED_CONTEXT.md file for inter-agent communication
 */

import fs from 'fs'
import path from 'path'
import { SharedContext, SharedStepContext, AgentMessage, PipelineStep } from '@/types/pipeline'

export function createSharedContext(
  projectPath: string,
  pipelineId: string,
  taskId: string,
  steps: PipelineStep[]
): SharedContext {
  const now = new Date().toISOString()
  
  const context: SharedContext = {
    pipelineId,
    taskId,
    createdAt: now,
    updatedAt: now,
    currentStep: 0,
    steps: steps.map((step, index) => ({
      stepId: step.id,
      stepName: step.name,
      status: index === 0 ? 'running' : 'pending',
      agents: [],
      outputs: []
    })),
    messages: []
  }
  
  writeSharedContext(projectPath, context)
  return context
}

export function readSharedContext(projectPath: string): SharedContext | null {
  try {
    const contextPath = path.join(projectPath, 'SHARED_CONTEXT.md')
    if (!fs.existsSync(contextPath)) {
      return null
    }
    
    const content = fs.readFileSync(contextPath, 'utf-8')
    return parseSharedContext(content)
  } catch (error) {
    console.error('[SharedContext] Failed to read:', error)
    return null
  }
}

export function writeSharedContext(projectPath: string, context: SharedContext): void {
  try {
    const contextPath = path.join(projectPath, 'SHARED_CONTEXT.md')
    const markdown = formatSharedContext(context)
    fs.writeFileSync(contextPath, markdown, 'utf-8')
  } catch (error) {
    console.error('[SharedContext] Failed to write:', error)
  }
}

export function updateStepStatus(
  projectPath: string,
  stepId: string,
  status: SharedStepContext['status'],
  summary?: string
): void {
  const context = readSharedContext(projectPath)
  if (!context) return
  
  const step = context.steps.find(s => s.stepId === stepId)
  if (!step) return
  
  step.status = status
  if (summary) step.summary = summary
  
  if (status === 'running' && !step.startedAt) {
    step.startedAt = new Date().toISOString()
  }
  if (status === 'completed' || status === 'failed') {
    step.completedAt = new Date().toISOString()
  }
  
  context.updatedAt = new Date().toISOString()
  writeSharedContext(projectPath, context)
}

export function addAgentToStep(
  projectPath: string,
  stepId: string,
  agentId: string,
  taskId: string
): void {
  const context = readSharedContext(projectPath)
  if (!context) return
  
  const step = context.steps.find(s => s.stepId === stepId)
  if (!step) return
  
  step.agents.push({
    agentId,
    taskId,
    status: 'running',
    progress: 0
  })
  
  context.updatedAt = new Date().toISOString()
  writeSharedContext(projectPath, context)
}

export function updateAgentProgress(
  projectPath: string,
  stepId: string,
  taskId: string,
  progress: number,
  status?: string
): void {
  const context = readSharedContext(projectPath)
  if (!context) return
  
  const step = context.steps.find(s => s.stepId === stepId)
  if (!step) return
  
  const agent = step.agents.find(a => a.taskId === taskId)
  if (!agent) return
  
  agent.progress = progress
  if (status) agent.status = status
  
  context.updatedAt = new Date().toISOString()
  writeSharedContext(projectPath, context)
}

export function addStepOutput(
  projectPath: string,
  stepId: string,
  output: string
): void {
  const context = readSharedContext(projectPath)
  if (!context) return
  
  const step = context.steps.find(s => s.stepId === stepId)
  if (!step) return
  
  if (!step.outputs.includes(output)) {
    step.outputs.push(output)
  }
  
  context.updatedAt = new Date().toISOString()
  writeSharedContext(projectPath, context)
}

export function addMessage(
  projectPath: string,
  from: string,
  to: string,
  message: string,
  stepId: string
): void {
  const context = readSharedContext(projectPath)
  if (!context) return
  
  context.messages.push({
    from,
    to,
    message,
    timestamp: new Date().toISOString(),
    stepId
  })
  
  context.updatedAt = new Date().toISOString()
  writeSharedContext(projectPath, context)
}

export function advanceToNextStep(projectPath: string): void {
  const context = readSharedContext(projectPath)
  if (!context) return
  
  // Mark current step complete
  const currentStep = context.steps[context.currentStep]
  if (currentStep) {
    currentStep.status = 'completed'
    currentStep.completedAt = new Date().toISOString()
  }
  
  // Advance to next step
  context.currentStep++
  if (context.currentStep < context.steps.length) {
    const nextStep = context.steps[context.currentStep]
    nextStep.status = 'running'
    nextStep.startedAt = new Date().toISOString()
  }
  
  context.updatedAt = new Date().toISOString()
  writeSharedContext(projectPath, context)
}

// Parse SHARED_CONTEXT.md to object
function parseSharedContext(content: string): SharedContext | null {
  try {
    // Extract JSON from markdown code block
    const match = content.match(/```json\n([\s\S]*?)\n```/)
    if (match) {
      return JSON.parse(match[1])
    }
    return null
  } catch {
    return null
  }
}

// Format SharedContext as markdown
function formatSharedContext(context: SharedContext): string {
  return `# Shared Context - Pipeline ${context.pipelineId}

## Overview
- **Task ID:** ${context.taskId}
- **Created:** ${context.createdAt}
- **Updated:** ${context.updatedAt}
- **Current Step:** ${context.currentStep + 1} of ${context.steps.length}

## Pipeline Status

${context.steps.map((step, index) => `
### Step ${index + 1}: ${step.stepName}
**Status:** ${getStatusEmoji(step.status)} ${step.status.toUpperCase()}
${step.startedAt ? `- **Started:** ${step.startedAt}` : ''}
${step.completedAt ? `- **Completed:** ${step.completedAt}` : ''}
${step.summary ? `- **Summary:** ${step.summary}` : ''}

**Agents:**
${step.agents.length > 0 
  ? step.agents.map(a => `- ${a.agentId}: ${a.status} (${a.progress}%)`).join('\n')
  : '- No agents assigned'}

**Outputs:**
${step.outputs.length > 0 
  ? step.outputs.map(o => `- ${o}`).join('\n')
  : '- No outputs yet'}
`).join('\n---\n')}

## Messages

${context.messages.length > 0
  ? context.messages.map(m => `**[${m.timestamp}] ${m.from} → ${m.to}:** ${m.message}`).join('\n\n')
  : '_No messages yet_'}

---

*This file is auto-updated by the pipeline system*

## Raw Data (JSON)

\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`
`
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'completed': return '✅'
    case 'running': return '🔄'
    case 'failed': return '❌'
    default: return '⏳'
  }
}