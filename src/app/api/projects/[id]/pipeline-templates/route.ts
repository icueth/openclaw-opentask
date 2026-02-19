import { NextResponse } from 'next/server'
import { PIPELINE_TEMPLATES } from '@/types/pipeline'

// GET /api/projects/[id]/pipeline-templates - Get available pipeline templates
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    return NextResponse.json({
      success: true,
      templates: PIPELINE_TEMPLATES
    })
  } catch (error: any) {
    console.error('[Pipeline Templates API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}