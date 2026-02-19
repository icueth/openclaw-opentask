/**
 * Pipeline Task Runner
 * Manages multi-agent pipeline execution
 */

import { Task, taskQueue, createTask, getTaskById, getTasksByProject, onTaskComplete, startTask, processQueue, updateTask } from './taskQueue'
import { store } from './store'
import { 
  PipelineConfig, 
  PipelineStep, 
  PIPELINE_TEMPLATES,
  SharedContext 
} from '@/types/pipeline'
import { 
  createSharedContext, 
  updateStepStatus, 
  addAgentToStep,
  advanceToNextStep 
} from './sharedContext'
import path from 'path'

interface PipelineTask extends Task {
  pipeline?: PipelineConfig
  pipelineStepId?: string
  pipelineAgentIndex?: number
}

// Track which pipelines have been started to prevent double-starting
const startedPipelines = new Set<string>()

// Create a pipeline task (parent) - BYPASSES QUEUE
export function createPipelineTask(
  projectId: string,
  title: string,
  description: string,
  pipelineConfig: PipelineConfig
): Task {
  // Generate unique ID
  const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Create the parent task directly (bypasses queue)
  const parentTask: Task = {
    id,
    projectId,
    title: `🔄 [Pipeline] ${title}`,
    description: `${description || `Multi-agent pipeline: ${pipelineConfig.templateId}`}\n\nPipeline: ${JSON.stringify(pipelineConfig)}\n\nNote: This is a pipeline tracking task. Child tasks will be spawned for each step.`,
    agentId: 'coordinator',
    priority: 'high',
    status: 'active', // Active but not in queue - we manage it manually
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    timeoutMinutes: 60,
    statusHistory: [
      { status: 'created', timestamp: new Date().toISOString(), message: 'Pipeline task created' },
      { status: 'active', timestamp: new Date().toISOString(), message: 'Pipeline started' }
    ]
  }
  
  // Add directly to tasks array (bypass createTask to avoid queue)
  const tasks = store.getTasks()
  tasks.push(parentTask)
  store.writeTasks(tasks)
  
  console.log(`[Pipeline] Created parent task ${id} (bypassed queue)`)
  
  // Initialize shared context
  const project = store.getProjectById(projectId)
  if (project) {
    createSharedContext(
      project.workspace || project.path,
      pipelineConfig.templateId,
      parentTask.id,
      pipelineConfig.steps
    )
  }
  
  // IMMEDIATELY start the first step (don't wait for queue)
  // Use a flag to prevent double-starting
  if (!startedPipelines.has(id)) {
    startedPipelines.add(id)
    console.log(`[Pipeline] Starting pipeline ${id} for the first time`)
    startPipeline(projectId, parentTask.id).catch(err => {
      console.error(`[Pipeline] Failed to start pipeline ${id}:`, err)
      startedPipelines.delete(id) // Allow retry on failure
    })
  } else {
    console.log(`[Pipeline] Pipeline ${id} already started, skipping`)
  }
  
  return parentTask
}

// Start the first step of the pipeline
export async function startPipeline(projectId: string, parentTaskId: string): Promise<void> {
  const parentTask = getTaskById(parentTaskId) as PipelineTask
  if (!parentTask) {
    console.error(`[Pipeline] Parent task ${parentTaskId} not found`)
    return
  }
  
  // Parse pipeline config from description
  let pipeline: PipelineConfig | null = null
  if (parentTask.description?.includes('Pipeline:')) {
    try {
      const match = parentTask.description.match(/Pipeline: ({.+})/s)
      if (match) {
        pipeline = JSON.parse(match[1])
      }
    } catch (e) {
      console.error(`[Pipeline] Failed to parse pipeline config:`, e)
    }
  }
  
  // Fallback to in-memory pipeline property (if set)
  if (!pipeline && parentTask.pipeline) {
    pipeline = parentTask.pipeline
  }
  
  if (!pipeline) {
    console.error(`[Pipeline] Parent task ${parentTaskId} has no pipeline config`)
    return
  }
  
  const firstStep = pipeline.steps[0]
  
  console.log(`[Pipeline] Starting pipeline for task ${parentTaskId}, step 1: ${firstStep.name}`)
  
  // Start the first step
  await spawnStepAgents(projectId, parentTaskId, firstStep, 0)
}

// Spawn agents for a specific step
async function spawnStepAgents(
  projectId: string,
  parentTaskId: string,
  step: PipelineStep,
  stepIndex: number
): Promise<void> {
  console.log(`[Pipeline] spawnStepAgents called: projectId=${projectId}, parentTaskId=${parentTaskId}, step=${step.name}, stepIndex=${stepIndex}`)
  
  const project = store.getProjectById(projectId)
  if (!project) {
    console.log(`[Pipeline] Project ${projectId} not found`)
    return
  }
  
  console.log(`[Pipeline] Spawning ${step.count} agents for step ${stepIndex + 1}: ${step.name}`)
  
  // Update shared context
  updateStepStatus(project.workspace || project.path, step.id, 'running')
  
  // Spawn agents in parallel
  const spawnPromises = []
  for (let i = 0; i < step.count; i++) {
    const agentIndex = i + 1
    const taskTitle = step.count > 1 
      ? `🔄 ${step.name} (${agentIndex}/${step.count})`
      : `🔄 ${step.name}`
    
    console.log(`[Pipeline] Creating child task ${i + 1}/${step.count}: ${taskTitle}`)
    const childTask = createTask({
      projectId,
      title: taskTitle,
      description: buildStepDescription(step, parentTaskId, stepIndex),
      agentId: step.agentId || project.agentId,
      priority: 'high',
      timeoutMinutes: 30
    })
    console.log(`[Pipeline] Created child task: ${childTask.id}`)
    
    // Add pipeline metadata to child task
    const task = getTaskById(childTask.id) as PipelineTask
    if (task) {
      task.pipelineStepId = step.id
      task.pipelineAgentIndex = i
      // Persist to store by updating description
      updateTask(childTask.id, {
        description: `${task.description}\n\nPipeline Metadata: stepId=${step.id}, agentIndex=${i}`
      })
      console.log(`[Pipeline] Updated child task metadata`)
    }
    
    // Add to shared context
    addAgentToStep(
      project.workspace || project.path,
      step.id,
      project.agentId,
      childTask.id
    )
    
    // Start the task
    startTask(childTask.id)
    spawnPromises.push(
      processQueue().catch(err => {
        console.error(`[Pipeline] Failed to spawn agent ${agentIndex}:`, err)
      })
    )
  }
  
  // Wait for all spawns to complete
  await Promise.all(spawnPromises)
  
  console.log(`[Pipeline] Spawned ${step.count} agents for step ${stepIndex + 1}`)
}

// Build step description with instructions and context
function buildStepDescription(step: PipelineStep, parentTaskId: string, stepIndex: number): string {
  let description = `## Pipeline Step ${stepIndex + 1}: ${step.name}\n\n`
  description += `**Type:** ${step.type}\n`
  description += `**Step ID:** ${step.id}\n`
  description += `**Instructions:** ${step.instructions}\n\n`
  
  if (step.dependsOn && step.dependsOn.length > 0) {
    description += `**Depends on:** ${step.dependsOn.join(', ')}\n\n`
  }
  
  description += `**Parent Task:** ${parentTaskId}\n\n`
  
  description += `## Important\n`
  description += `1. Read SHARED_CONTEXT.md for current pipeline status\n`
  description += `2. Update your progress in SHARED_CONTEXT.md\n`
  description += `3. Communicate with other agents via SHARED_CONTEXT.md\n`
  description += `4. When complete, report completion\n`
  
  if (step.outputFiles && step.outputFiles.length > 0) {
    description += `\n**Expected Outputs:**\n`
    step.outputFiles.forEach(file => {
      description += `- ${file}\n`
    })
  }
  
  return description
}

// Parse pipeline config from task description
function parsePipelineConfig(task: Task): PipelineConfig | null {
  if (task.description?.includes('Pipeline:')) {
    try {
      const match = task.description.match(/Pipeline: ({.+})/s)
      if (match) {
        return JSON.parse(match[1])
      }
    } catch (e) {
      console.error(`[Pipeline] Failed to parse pipeline config:`, e)
    }
  }
  return null
}

// Check if a step is complete and advance to next
export async function checkStepCompletion(
  projectId: string,
  parentTaskId: string,
  stepId: string
): Promise<boolean> {
  console.log(`[Pipeline] checkStepCompletion called: projectId=${projectId}, parentTaskId=${parentTaskId}, stepId=${stepId}`)
  
  const project = store.getProjectById(projectId)
  const parentTask = getTaskById(parentTaskId) as PipelineTask
  
  if (!project || !parentTask) {
    console.log(`[Pipeline] Missing project or parentTask`)
    return false
  }
  
  // Parse pipeline config from description
  const pipeline = parsePipelineConfig(parentTask)
  if (!pipeline) {
    console.error(`[Pipeline] Could not parse pipeline config for ${parentTaskId}`)
    return false
  }
  
  console.log(`[Pipeline] Pipeline has ${pipeline.steps.length} steps`)
  const stepIndex = pipeline.steps.findIndex(s => s.id === stepId)
  if (stepIndex === -1) {
    console.log(`[Pipeline] Step ${stepId} not found in pipeline`)
    return false
  }
  console.log(`[Pipeline] Found step ${stepId} at index ${stepIndex}`)
  
  const step = pipeline.steps[stepIndex]
  
  // Get all child tasks for this step
  const allTasks = getTasksByProject(projectId)
  console.log(`[Pipeline] Total tasks in project: ${allTasks.length}`)
  
  const stepTasks = allTasks.filter(t => {
    // Check by title (contains step name) AND description (contains stepId)
    const hasStepInTitle = t.title.includes(step.name)
    const hasStepIdInDesc = t.description?.includes(`stepId=${stepId}`) || 
                            t.description?.includes(`Step ID: ${stepId}`)
    console.log(`[Pipeline] Checking task ${t.id}: titleMatch=${hasStepInTitle}, stepIdMatch=${hasStepIdInDesc}, status=${t.status}`)
    return hasStepInTitle && hasStepIdInDesc
  })
  
  console.log(`[Pipeline] Found ${stepTasks.length} tasks for step ${step.name} (stepId=${stepId})`)
  
  // Check if all agents completed
  const allCompleted = stepTasks.every(t => t.status === 'completed')
  const anyFailed = stepTasks.some(t => t.status === 'failed')
  
  console.log(`[Pipeline] Step status: allCompleted=${allCompleted}, anyFailed=${anyFailed}`)
  
  if (allCompleted) {
    console.log(`[Pipeline] Step ${stepIndex + 1} (${step.name}) completed`)
    
    // Update shared context
    updateStepStatus(project.workspace || project.path, stepId, 'completed')
    
    // Check if this is the last step
    if (stepIndex === pipeline.steps.length - 1) {
      console.log(`[Pipeline] All steps completed for ${parentTaskId}`)
      // Complete parent task
      onTaskComplete(parentTaskId, 'Pipeline completed successfully')
      return true
    }
    
    // Advance to next step
    advanceToNextStep(project.workspace || project.path)
    
    // Start next step
    const nextStep = pipeline.steps[stepIndex + 1]
    await spawnStepAgents(projectId, parentTaskId, nextStep, stepIndex + 1)
    
    return true
  }
  
  if (anyFailed) {
    console.log(`[Pipeline] Step ${stepIndex + 1} (${step.name}) has failures`)
    updateStepStatus(project.workspace || project.path, stepId, 'failed')
    return false
  }
  
  return false
}

// Get available pipeline templates
export function getPipelineTemplates() {
  return PIPELINE_TEMPLATES
}

// Get pipeline status
export function getPipelineStatus(parentTaskId: string): {
  step: number
  totalSteps: number
  currentStepName: string
  status: string
} | null {
  const parentTask = getTaskById(parentTaskId) as PipelineTask
  if (!parentTask) return null
  
  // Parse pipeline config from description
  const pipeline = parsePipelineConfig(parentTask)
  if (!pipeline) return null
  
  const project = store.getProjectById(parentTask.projectId)
  if (!project) return null
  
  // Read from shared context
  const { readSharedContext } = require('./sharedContext')
  const context = readSharedContext(project.workspace || project.path)
  
  if (!context) {
    return {
      step: 0,
      totalSteps: pipeline.steps.length,
      currentStepName: pipeline.steps[0]?.name || 'Unknown',
      status: 'starting'
    }
  }
  
  return {
    step: context.currentStep + 1,
    totalSteps: context.steps.length,
    currentStepName: context.steps[context.currentStep]?.stepName || 'Unknown',
    status: context.steps[context.currentStep]?.status || 'pending'
  }
}