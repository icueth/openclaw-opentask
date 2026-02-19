import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.env.HOME || '', '.openclaw', 'openclaw.json')

// GET available models from actual config
export async function GET() {
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8')
    const config = JSON.parse(configContent)
    
    const providers = config.models?.providers || {}
    const primaryModel = config.agents?.defaults?.model?.primary || ''
    
    // Also get models referenced in defaults.models (for aliases)
    const defaultModels = config.agents?.defaults?.models || {}
    
    const models: any[] = []
    const seenIds = new Set<string>()
    
    // From providers
    for (const [providerName, providerConfig] of Object.entries(providers)) {
      const provider = providerConfig as any
      if (provider.models) {
        for (const model of provider.models) {
          const modelId = `${providerName}/${model.id}`
          if (!seenIds.has(modelId)) {
            seenIds.add(modelId)
            models.push({
              id: modelId,
              name: model.name || model.id,
              provider: providerName,
              contextWindow: model.contextWindow || 128000,
              maxTokens: model.maxTokens || 4096,
              reasoning: model.reasoning || false,
              isPrimary: modelId === primaryModel,
              alias: defaultModels[modelId]?.alias
            })
          }
        }
      }
    }
    
    // Also add models from defaults.models that might not be in providers
    for (const [modelId, modelConfig] of Object.entries(defaultModels)) {
      if (!seenIds.has(modelId)) {
        seenIds.add(modelId)
        const [provider, id] = modelId.split('/')
        models.push({
          id: modelId,
          name: (modelConfig as any)?.alias || id || modelId,
          provider: provider || 'unknown',
          contextWindow: 128000,
          maxTokens: 8192,
          reasoning: true,
          isPrimary: modelId === primaryModel,
          alias: (modelConfig as any)?.alias
        })
      }
    }
    
    return NextResponse.json({
      models,
      primaryModel,
      providers: [...new Set(models.map(m => m.provider))]
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message, 
      models: [], 
      primaryModel: '', 
      providers: [] 
    }, { status: 500 })
  }
}
