/**
 * Pipeline Types for Multi-Agent Workflow
 */

export interface PipelineStep {
  id: string
  name: string
  type: 'evaluator' | 'worker' | 'integrator' | 'reviewer' | 'tester' | 'custom'
  agentId?: string  // Specific agent or auto-assign
  count: number     // Number of parallel agents for this step
  dependsOn?: string[]  // Step IDs that must complete before this
  instructions: string
  outputFiles?: string[]
}

export interface PipelineTemplate {
  id: string
  name: string
  description: string
  steps: PipelineStep[]
}

export interface PipelineConfig {
  templateId: string
  steps: PipelineStep[]
  sharedContext: boolean  // Use SHARED_CONTEXT.md
}

export interface PipelineState {
  currentStep: number
  totalSteps: number
  stepStatus: Record<string, 'pending' | 'running' | 'completed' | 'failed'>
  stepAgents: Record<string, string[]>  // stepId -> agent task IDs
  sharedContext: SharedContext
}

export interface SharedContext {
  pipelineId: string
  taskId: string
  createdAt: string
  updatedAt: string
  currentStep: number
  steps: SharedStepContext[]
  messages: AgentMessage[]
}

export interface SharedStepContext {
  stepId: string
  stepName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: string
  completedAt?: string
  agents: {
    agentId: string
    taskId: string
    status: string
    progress: number
  }[]
  outputs: string[]
  summary?: string
}

export interface AgentMessage {
  from: string
  to: string
  message: string
  timestamp: string
  stepId: string
}

// Pre-defined pipeline templates
export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'software-dev',
    name: 'Software Development',
    description: 'Complete software development pipeline with evaluation, parallel workers, integration, review, and testing',
    steps: [
      {
        id: 'evaluator',
        name: 'Evaluator & Planner',
        type: 'evaluator',
        count: 1,
        instructions: 'Analyze requirements and create detailed technical plan (PLAN.md)',
        outputFiles: ['PLAN.md', 'ARCHITECTURE.md']
      },
      {
        id: 'workers',
        name: 'Development Workers',
        type: 'worker',
        count: 3,
        dependsOn: ['evaluator'],
        instructions: 'Implement assigned components based on PLAN.md',
        outputFiles: []
      },
      {
        id: 'integrator',
        name: 'System Integrator',
        type: 'integrator',
        count: 1,
        dependsOn: ['workers'],
        instructions: 'Merge all worker outputs, resolve conflicts, create unified system',
        outputFiles: ['INTEGRATION_REPORT.md']
      },
      {
        id: 'reviewer',
        name: 'Code Reviewer',
        type: 'reviewer',
        count: 1,
        dependsOn: ['integrator'],
        instructions: 'Review code quality, best practices, and suggest improvements',
        outputFiles: ['REVIEW_REPORT.md']
      },
      {
        id: 'tester',
        name: 'QA Tester',
        type: 'tester',
        count: 1,
        dependsOn: ['integrator'],
        instructions: 'Create and run tests, verify functionality',
        outputFiles: ['TEST_RESULTS.md']
      }
    ]
  },
  {
    id: 'content-creation',
    name: 'Content Creation',
    description: 'Research, write, and edit content',
    steps: [
      {
        id: 'researcher',
        name: 'Researcher',
        type: 'evaluator',
        count: 1,
        instructions: 'Research topic and create content outline',
        outputFiles: ['RESEARCH.md', 'OUTLINE.md']
      },
      {
        id: 'writers',
        name: 'Content Writers',
        type: 'worker',
        count: 2,
        dependsOn: ['researcher'],
        instructions: 'Write content sections based on outline',
        outputFiles: []
      },
      {
        id: 'editor',
        name: 'Editor',
        type: 'reviewer',
        count: 1,
        dependsOn: ['writers'],
        instructions: 'Edit and polish final content',
        outputFiles: ['FINAL_CONTENT.md']
      }
    ]
  },
  {
    id: 'simple',
    name: 'Simple Task',
    description: 'Single agent execution (default behavior)',
    steps: [
      {
        id: 'worker',
        name: 'Worker',
        type: 'custom',
        count: 1,
        instructions: 'Execute the task',
        outputFiles: []
      }
    ]
  }
]