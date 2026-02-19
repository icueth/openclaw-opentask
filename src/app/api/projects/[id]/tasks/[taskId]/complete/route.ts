import { NextResponse } from 'next/server'
import { taskQueue } from '@/lib/taskQueue'
import { store } from '@/lib/store'
import { logTaskToMemory } from '@/lib/memory'
import { checkStepCompletion } from '@/lib/pipelineRunner'
import fs from 'fs'
import path from 'path'

interface CompleteTaskRequest {
  result: string
  artifacts?: string[]
}

// POST /api/projects/[id]/tasks/[taskId]/complete - Mark task as completed
export async function POST(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await Promise.resolve(params)
    const body: CompleteTaskRequest = await request.json()
    
    console.log(`[Complete API] Task ${taskId} completion request:`, { 
      result: body.result?.substring(0, 100),
      artifacts: body.artifacts 
    })
    
    // Get project from store
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const projectPath = project.workspace || project.path
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ error: 'Project folder not found' }, { status: 404 })
    }
    
    // Get task
    const task = taskQueue.getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 })
    }
    
    // Only processing tasks can be completed, but allow already-completed tasks for pipeline advancement
    if (task.status !== 'processing' && task.status !== 'active' && task.status !== 'completed') {
      console.log(`[Complete API] Task ${taskId} cannot be completed - status is ${task.status}`)
      return NextResponse.json(
        { error: `Cannot complete task with status ${task.status}` },
        { status: 400 }
      )
    }
    
    // If task is already completed, just trigger pipeline advancement (don't update status again)
    const alreadyCompleted = task.status === 'completed'
    
    // Verify artifacts exist and build verified list
    const verifiedArtifacts: string[] = []
    const missingArtifacts: string[] = []
    
    if (body.artifacts && body.artifacts.length > 0) {
      for (const artifact of body.artifacts) {
        const artifactPath = path.isAbsolute(artifact) 
          ? artifact 
          : path.join(projectPath, artifact)
        
        if (fs.existsSync(artifactPath)) {
          verifiedArtifacts.push(artifactPath)
          console.log(`[Complete API] Verified artifact exists: ${artifactPath}`)
        } else {
          missingArtifacts.push(artifact)
          console.log(`[Complete API] Missing artifact: ${artifactPath}`)
        }
      }
    }
    
    // Also check if any files were created in project directory that match the task
    const files = fs.readdirSync(projectPath)
    console.log(`[Complete API] Project files after task:`, files)
    
    // Build enhanced result message
    let enhancedResult = body.result || 'Task completed'
    
    if (verifiedArtifacts.length > 0) {
      enhancedResult += `\n\n📁 Created files:\n${verifiedArtifacts.map(a => `- ${path.relative(projectPath, a) || a}`).join('\n')}`
    }
    
    if (missingArtifacts.length > 0) {
      enhancedResult += `\n\n⚠️ Files not found:\n${missingArtifacts.map(a => `- ${a}`).join('\n')}`
    }
    
    // Skip status update if already completed (for pipeline advancement)
    if (!alreadyCompleted) {
      // Auto-set progress to 100% when completing
      await store.updateTaskProgress(taskId, 100, "Task completed successfully")
      
      // Also update task directly
      await store.updateTask(taskId, {
        progress: 100,
        currentStep: "Task completed"
      })
      
      // Complete task with verified artifacts
      taskQueue.onTaskComplete(taskId, enhancedResult, verifiedArtifacts)
    }
    
    const completedTask = taskQueue.getTaskById(taskId)
    
    // GROUND RULE: Auto-log to MEMORY.md
    try {
      if (completedTask && project) {
        await logTaskToMemory(completedTask, {
          result: enhancedResult,
          artifacts: verifiedArtifacts
        }, undefined, {
          name: project.name,
          workspace: project.workspace,
          path: project.path
        })
        console.log(`[Complete API] Task ${taskId} logged to MEMORY.md`)
      }
    } catch (memoryError) {
      console.error(`[Complete API] Failed to log task ${taskId} to memory:`, memoryError)
      // Don't fail the task completion if memory logging fails
    }
    
    // Check if this is a pipeline step task and advance if needed
    let pipelineAdvanced = false
    console.log(`[Complete API] Checking pipeline conditions: hasTask=${!!completedTask}, hasDesc=${!!completedTask?.description}, hasParent=${completedTask?.description?.includes('Parent Task:')}, hasStepId=${completedTask?.description?.includes('Step ID:')}`)
    if (completedTask && completedTask.description?.includes('Parent Task:') && completedTask.description?.includes('Step ID:')) {
      const parentRegex = /Parent Task:\s*\*?\*?\s*([a-zA-Z0-9-_]+)/
      const stepRegex = /Step ID:\s*\*?\*?\s*([a-zA-Z0-9-_]+)/
      const parentMatch = completedTask.description.match(parentRegex)
      const stepMatch = completedTask.description.match(stepRegex)
      console.log(`[Complete API] Regex patterns: parent=${parentRegex.source}, step=${stepRegex.source}`)
      console.log(`[Complete API] Regex matches: parentMatch=${!!parentMatch}, stepMatch=${!!stepMatch}`)
      if (parentMatch) console.log(`[Complete API] Parent ID: ${parentMatch[1]}`)
      if (stepMatch) console.log(`[Complete API] Step ID: ${stepMatch[1]}`)
      if (parentMatch && stepMatch) {
        const parentTaskId = parentMatch[1]
        const stepId = stepMatch[1]
        console.log(`[Complete API] Checking pipeline step completion for parent ${parentTaskId}, step ${stepId}`)
        pipelineAdvanced = await checkStepCompletion(projectId, parentTaskId, stepId)
      }
    }
    
    console.log(`[Complete API] Task ${taskId} completed successfully`, {
      verifiedArtifacts: verifiedArtifacts.length,
      missingArtifacts: missingArtifacts.length,
      pipelineAdvanced
    })
    
    return NextResponse.json({
      success: true,
      message: 'Task completed',
      task: completedTask,
      verifiedArtifacts,
      missingArtifacts: missingArtifacts.length > 0 ? missingArtifacts : undefined,
      memoryUpdated: true,
      pipelineAdvanced
    })
  } catch (error: any) {
    console.error(`[Complete API] Error completing task:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}