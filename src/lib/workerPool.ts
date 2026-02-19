/**
 * Worker Pool System for Multi-Agent Single Task
 * Spawn multiple agents to work on the same task in parallel
 */

import { Task, createTask, startTask, processQueue, getTaskById, updateTask } from './taskQueue'
import { store } from './store'
import { 
  createSharedContext, 
  updateStepStatus,
  addAgentToStep,
  updateAgentProgress,
  addStepOutput,
  addMessage,
  readSharedContext
} from './sharedContext'
import { PipelineStep } from '@/types/pipeline'

export interface WorkerPoolConfig {
  taskId: string
  projectId: string
  workerCount: number
  workDistribution: 'split' | 'collaborative' | 'review' // How to divide work
  instructions: string
}

export interface WorkerAssignment {
  workerIndex: number
  taskId: string
  scope: string
  instructions: string
}

// Create a worker pool for a single task
export async function createWorkerPool(
  config: WorkerPoolConfig
): Promise<WorkerAssignment[]> {
  const { taskId, projectId, workerCount, workDistribution, instructions } = config
  
  const project = store.getProjectById(projectId)
  if (!project) {
    throw new Error('Project not found')
  }
  
  const parentTask = getTaskById(taskId)
  if (!parentTask) {
    throw new Error('Parent task not found')
  }
  
  console.log(`[WorkerPool] Creating ${workerCount} workers for task ${taskId}`)
  
  // Update parent task to indicate it has a worker pool
  updateTask(taskId, {
    description: `${parentTask.description}\n\n[Worker Pool] ${workerCount} workers in ${workDistribution} mode`
  })
  
  // Create shared context for worker coordination
  const step: PipelineStep = {
    id: 'worker-pool',
    name: 'Worker Pool',
    type: 'worker',
    count: workerCount,
    instructions,
    outputFiles: []
  }
  
  createSharedContext(
    project.workspace || project.path,
    'worker-pool',
    taskId,
    [step]
  )
  
  // Generate work distribution
  const assignments: WorkerAssignment[] = []
  const scopes = generateWorkScopes(workDistribution, workerCount, instructions)
  
  // Spawn workers
  for (let i = 0; i < workerCount; i++) {
    const workerIndex = i + 1
    const scope = scopes[i]
    
    const workerTask = createTask({
      projectId,
      title: `👷 Worker ${workerIndex}/${workerCount}: ${parentTask.title}`,
      description: buildWorkerDescription(parentTask, workerIndex, workerCount, scope, workDistribution),
      agentId: parentTask.agentId,
      priority: 'high',
      timeoutMinutes: 30
    })
    
    // Add worker metadata
    const worker = getTaskById(workerTask.id)
    if (worker) {
      updateTask(workerTask.id, {
        description: `${worker.description}\n\nParent Task: ${taskId}\nWorker Index: ${workerIndex}\nTotal Workers: ${workerCount}`
      })
    }
    
    // Add to shared context
    addAgentToStep(
      project.workspace || project.path,
      'worker-pool',
      parentTask.agentId,
      workerTask.id
    )
    
    // Start worker
    startTask(workerTask.id)
    processQueue().catch(err => {
      console.error(`[WorkerPool] Failed to spawn worker ${workerIndex}:`, err)
    })
    
    assignments.push({
      workerIndex,
      taskId: workerTask.id,
      scope,
      instructions
    })
  }
  
  console.log(`[WorkerPool] Spawned ${workerCount} workers for task ${taskId}`)
  return assignments
}

// Generate work scopes based on distribution strategy
function generateWorkScopes(
  strategy: string,
  count: number,
  instructions: string
): string[] {
  const scopes: string[] = []
  
  switch (strategy) {
    case 'split':
      // Divide work into equal parts
      for (let i = 0; i < count; i++) {
        scopes.push(`Part ${i + 1}/${count}: Work on assigned portion`)
      }
      break
      
    case 'collaborative':
      // All workers do the same thing but communicate
      for (let i = 0; i < count; i++) {
        scopes.push(`Collaborative work with coordination`)
      }
      break
      
    case 'review':
      // First does work, others review
      scopes.push('Primary: Implement the solution')
      for (let i = 1; i < count; i++) {
        scopes.push(`Reviewer ${i}: Review and suggest improvements`)
      }
      break
      
    default:
      for (let i = 0; i < count; i++) {
        scopes.push(`Worker ${i + 1} tasks`)
      }
  }
  
  return scopes
}

// Build worker-specific description
function buildWorkerDescription(
  parentTask: Task,
  workerIndex: number,
  totalWorkers: number,
  scope: string,
  strategy: string
): string {
  let description = `## Worker ${workerIndex} of ${totalWorkers}\n\n`
  description += `**Parent Task:** ${parentTask.title}\n`
  description += `**Strategy:** ${strategy}\n`
  description += `**Your Scope:** ${scope}\n\n`
  description += `## Instructions\n${parentTask.description}\n\n`
  description += `## Worker Pool Guidelines\n`
  description += `1. You are part of a ${totalWorkers}-person team working on this task\n`
  description += `2. Read SHARED_CONTEXT.md to see what others are doing\n`
  description += `3. Update your progress regularly\n`
  
  if (strategy === 'collaborative') {
    description += `4. Coordinate with other workers through SHARED_CONTEXT.md\n`
    description += `5. Avoid duplicate work by checking what others have done\n`
  } else if (strategy === 'split') {
    description += `4. Focus on your assigned portion only\n`
    description += `5. Your work will be merged with others at the end\n`
  } else if (strategy === 'review') {
    if (workerIndex === 1) {
      description += `4. You are the PRIMARY implementer\n`
      description += `5. Others will review your work\n`
    } else {
      description += `4. You are a REVIEWER\n`
      description += `5. Check the primary implementer's work and suggest improvements\n`
    }
  }
  
  description += `\n## Communication\n`
  description += `Use SHARED_CONTEXT.md to:\n`
  description += `- Report your progress\n`
  description += `- Ask questions to other workers\n`
  description += `- Share findings or issues\n`
  
  return description
}

// Check if all workers in a pool are complete
export async function checkWorkerPoolCompletion(
  projectId: string,
  parentTaskId: string
): Promise<{
  complete: boolean
  allWorkers: string[]
  completedWorkers: string[]
  failedWorkers: string[]
}> {
  const project = store.getProjectById(projectId)
  if (!project) {
    return { complete: false, allWorkers: [], completedWorkers: [], failedWorkers: [] }
  }
  
  // Find all worker tasks for this parent
  const allTasks = store.getTasksByProjectId(projectId)
  const workerTasks = allTasks.filter(t => {
    return t.description?.includes(`Parent Task: ${parentTaskId}`) &&
           t.description?.includes('Worker')
  })
  
  const allWorkerIds = workerTasks.map(t => t.id)
  const completedWorkers = workerTasks.filter(t => t.status === 'completed').map(t => t.id)
  const failedWorkers = workerTasks.filter(t => t.status === 'failed').map(t => t.id)
  
  const complete = completedWorkers.length === allWorkerIds.length && allWorkerIds.length > 0
  
  return {
    complete,
    allWorkers: allWorkerIds,
    completedWorkers,
    failedWorkers
  }
}

// Merge worker outputs when all complete
export async function mergeWorkerOutputs(
  projectId: string,
  parentTaskId: string
): Promise<string> {
  const project = store.getProjectById(projectId)
  if (!project) {
    throw new Error('Project not found')
  }
  
  const context = readSharedContext(project.workspace || project.path)
  if (!context) {
    return 'No shared context found'
  }
  
  // Find the worker pool step
  const workerStep = context.steps.find(s => s.stepId === 'worker-pool')
  if (!workerStep) {
    return 'No worker pool data found'
  }
  
  // Build merge report
  let report = `# Worker Pool Results\n\n`
  report += `**Task:** ${parentTaskId}\n`
  report += `**Workers:** ${workerStep.agents.length}\n`
  report += `**Status:** ${workerStep.status}\n\n`
  
  report += `## Worker Outputs\n\n`
  workerStep.agents.forEach((agent, index) => {
    report += `### Worker ${index + 1} (${agent.agentId})\n`
    report += `- Status: ${agent.status}\n`
    report += `- Progress: ${agent.progress}%\n\n`
  })
  
  report += `## Outputs\n`
  workerStep.outputs.forEach(output => {
    report += `- ${output}\n`
  })
  
  report += `\n## Messages\n`
  context.messages.forEach(msg => {
    report += `[${msg.from} → ${msg.to}]: ${msg.message}\n`
  })
  
  return report
}