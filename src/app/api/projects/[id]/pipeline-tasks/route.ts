import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { 
  createPipelineTask, 
  startPipeline, 
  getPipelineTemplates,
  getPipelineStatus
} from '@/lib/pipelineRunner'
import { PIPELINE_TEMPLATES } from '@/types/pipeline'

// GET /api/projects/[id]/pipeline-tasks - Get pipeline templates or status
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const templates = searchParams.get('templates')
    const status = searchParams.get('status')
    
    // Return pipeline templates
    if (templates === 'true') {
      return NextResponse.json({
        success: true,
        templates: PIPELINE_TEMPLATES
      })
    }
    
    // Return pipeline status
    if (status) {
      const pipelineStatus = getPipelineStatus(status)
      return NextResponse.json({
        success: true,
        status: pipelineStatus
      })
    }
    
    return NextResponse.json({
      success: true,
      templates: PIPELINE_TEMPLATES
    })
  } catch (error: any) {
    console.error('[Pipeline API] GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/projects/[id]/pipeline-tasks - Create new pipeline task
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // Check project exists
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    
    if (!body.pipelineTemplate && !body.pipeline) {
      return NextResponse.json({ error: 'Pipeline template or config is required' }, { status: 400 })
    }
    
    let pipelineConfig
    
    // Use template or custom config
    if (body.pipelineTemplate) {
      const template = PIPELINE_TEMPLATES.find(t => t.id === body.pipelineTemplate)
      if (!template) {
        return NextResponse.json({ error: `Template "${body.pipelineTemplate}" not found` }, { status: 404 })
      }
      
      // Customize steps based on worker count
      const steps = template.steps.map(step => ({
        ...step,
        count: step.type === 'worker' && body.workerCount 
          ? body.workerCount 
          : step.count
      }))
      
      pipelineConfig = {
        templateId: template.id,
        steps,
        sharedContext: true
      }
    } else {
      pipelineConfig = body.pipeline
    }
    
    // Create the pipeline task (this also starts the pipeline automatically)
    const parentTask = createPipelineTask(
      projectId,
      body.title,
      body.description || '',
      pipelineConfig
    )
    
    // Note: startPipeline is now called internally by createPipelineTask
    // to ensure immediate step spawning without queue processing
    
    return NextResponse.json({
      success: true,
      task: parentTask,
      pipeline: pipelineConfig,
      message: `Pipeline "${pipelineConfig.templateId}" started with ${pipelineConfig.steps.length} steps`
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('[Pipeline API] POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}