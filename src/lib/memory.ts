/**
 * Memory System - Persistent Memory Logging
 * Ground Rule: Every task MUST log to MEMORY.md when completed
 * Ground Rule: Every new task MUST read MEMORY.md before starting
 */

import fs from 'fs'
import path from 'path'
import { Task } from './taskQueue'

// Memory Entry Structure
export interface MemoryEntry {
  timestamp: Date
  taskId: string
  taskTitle: string
  agentId: string
  agentName: string
  status: 'completed' | 'failed'
  filesModified: string[]
  summary: string
  keyPoints: string[]
  decisions?: string[]
}

// Task Result from sub-agent completion
export interface TaskResult {
  result: string
  artifacts?: string[]
}

/**
 * Format a date for memory entry
 */
export function formatMemoryDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 16)
}

/**
 * Extract key points from a result string
 */
export function extractKeyPoints(result: string): string[] {
  if (!result) return []
  
  const points: string[] = []
  
  // Look for bullet points, numbered lists, or key sentences
  const lines = result.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Match bullet points (•, -, *) or numbered lists (1., 2.)
    if (/^[•\-\*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const point = trimmed.replace(/^[•\-\*\d\.]\s+/, '').trim()
      if (point.length > 10 && point.length < 200) {
        points.push(point)
      }
    }
    
    // Match "Key finding" or "Important" lines
    if (/^(key|important|note|decision|learned|created|implemented)/i.test(trimmed)) {
      if (trimmed.length > 10 && trimmed.length < 200) {
        points.push(trimmed)
      }
    }
  }
  
  // If no structured points found, extract first few sentences
  if (points.length === 0) {
    const sentences = result
      .replace(/\n/g, ' ')
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 150)
      .slice(0, 3)
    
    points.push(...sentences)
  }
  
  return points.slice(0, 5) // Max 5 key points
}

/**
 * Generate a memory entry markdown string
 */
export function generateMemoryEntry(
  task: Task,
  result: TaskResult,
  agentName: string = 'Unknown Agent'
): string {
  const timestamp = formatMemoryDate(new Date())
  const filesModified = result.artifacts || task.artifacts || []
  const summary = result.result || task.result || 'No result provided'
  const keyPoints = extractKeyPoints(summary)
  
  return `### ${timestamp} - Task: ${task.title}
**Agent:** ${agentName} (${task.agentId})  
**Status:** ${task.status === 'completed' ? '✅ Completed' : '❌ Failed'}  
**Files Modified:**
${filesModified.length > 0 
  ? filesModified.map(f => `- ${path.basename(f)}`).join('\n') 
  : '- None'}

**Summary:**  
${summary.substring(0, 800)}${summary.length > 800 ? '...' : ''}

**Key Points:**
${keyPoints.length > 0 
  ? keyPoints.map(p => `- ${p}`).join('\n') 
  : '- Task completed'}
`
}

/**
 * Read MEMORY.md from project path
 */
export async function readMemory(projectPath: string): Promise<string> {
  const memoryPath = path.join(projectPath, 'MEMORY.md')
  
  console.log(`[Memory] Reading MEMORY.md from: ${memoryPath}`)
  
  try {
    if (!fs.existsSync(memoryPath)) {
      console.log(`[Memory] MEMORY.md not found at: ${memoryPath}`)
      return ''
    }
    const content = fs.readFileSync(memoryPath, 'utf-8')
    console.log(`[Memory] ✓ Read MEMORY.md (${content.length} chars)`)
    return content
  } catch (error) {
    console.error(`[Memory] Error reading memory from ${memoryPath}:`, error)
    return ''
  }
}

/**
 * Read MEMORY.md synchronously
 */
export function readMemorySync(projectPath: string): string {
  const memoryPath = path.join(projectPath, 'MEMORY.md')
  
  console.log(`[Memory] Reading MEMORY.md (sync) from: ${memoryPath}`)
  
  try {
    if (!fs.existsSync(memoryPath)) {
      console.log(`[Memory] MEMORY.md not found at: ${memoryPath}`)
      return ''
    }
    const content = fs.readFileSync(memoryPath, 'utf-8')
    console.log(`[Memory] ✓ Read MEMORY.md (sync) - ${content.length} chars`)
    return content
  } catch (error) {
    console.error(`[Memory] Error reading memory from ${memoryPath}:`, error)
    return ''
  }
}

/**
 * Append a memory entry to MEMORY.md
 */
export async function appendMemoryEntry(
  projectPath: string,
  entry: MemoryEntry
): Promise<void> {
  const memoryPath = path.join(projectPath, 'MEMORY.md')
  
  const entryMarkdown = `### ${formatMemoryDate(entry.timestamp)} - Task: ${entry.taskTitle}
**Agent:** ${entry.agentName} (${entry.agentId})  
**Status:** ${entry.status === 'completed' ? '✅ Completed' : '❌ Failed'}  
**Files Modified:**
${entry.filesModified.length > 0 
  ? entry.filesModified.map(f => `- ${path.basename(f)}`).join('\n') 
  : '- None'}

**Summary:**  
${entry.summary.substring(0, 800)}${entry.summary.length > 800 ? '...' : ''}

**Key Points:**
${entry.keyPoints.length > 0 
  ? entry.keyPoints.map(p => `- ${p}`).join('\n') 
  : '- Task completed'}
`
  
  await appendToMemoryFile(projectPath, entryMarkdown)
}

/**
 * Append raw markdown to MEMORY.md (prepends to top)
 */
export async function appendToMemoryFile(
  projectPath: string,
  markdownEntry: string
): Promise<void> {
  const memoryPath = path.join(projectPath, 'MEMORY.md')
  
  console.log(`[Memory] Appending to MEMORY.md at: ${memoryPath}`)
  
  try {
    // Ensure project directory exists
    if (!fs.existsSync(projectPath)) {
      console.log(`[Memory] Creating project directory: ${projectPath}`)
      fs.mkdirSync(projectPath, { recursive: true })
    }
    
    // Read existing content or create header
    let existing = ''
    if (fs.existsSync(memoryPath)) {
      existing = fs.readFileSync(memoryPath, 'utf-8')
      console.log(`[Memory] Existing content: ${existing.length} chars`)
    } else {
      console.log(`[Memory] MEMORY.md doesn't exist, will create new`)
    }
    
    // If empty, add header
    if (!existing.trim()) {
      const projectName = path.basename(projectPath)
      existing = `# ${projectName} - Project Memory

## Recent Changes (Auto-generated from tasks)

`
      console.log(`[Memory] Created new header for ${projectName}`)
    }
    
    // Prepend new entry (newest first)
    const separator = '\n\n---\n\n'
    const updated = markdownEntry + separator + existing
    
    fs.writeFileSync(memoryPath, updated, 'utf-8')
    console.log(`[Memory] ✓ Updated MEMORY.md (${updated.length} chars total)`)
  } catch (error) {
    console.error(`[Memory] ✗ Error writing memory to ${memoryPath}:`, error)
    throw error
  }
}

/**
 * Get recent memory entries (parsed from MEMORY.md)
 */
export async function getRecentMemory(
  projectPath: string,
  count: number = 5
): Promise<MemoryEntry[]> {
  const memory = await readMemory(projectPath)
  
  if (!memory) return []
  
  // Parse entries from markdown
  // Simple parsing - looks for ### headers with dates
  const entries: MemoryEntry[] = []
  const entryRegex = /###\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+-\s+Task:\s+(.+?)\n/g
  
  let match
  while ((match = entryRegex.exec(memory)) !== null && entries.length < count) {
    const timestamp = new Date(match[1])
    const taskTitle = match[2].trim()
    
    // Extract the full entry block (until next ### or end)
    const startIdx = match.index
    const nextMatch = entryRegex.exec(memory)
    const endIdx = nextMatch ? nextMatch.index : memory.length
    entryRegex.lastIndex = startIdx + 1 // Reset for next iteration
    
    const entryBlock = memory.substring(startIdx, endIdx)
    
    // Parse status
    const statusMatch = entryBlock.match(/\*\*Status:\*\*\s+(✅\s+Completed|❌\s+Failed)/)
    const status = statusMatch?.[1].includes('Completed') ? 'completed' : 'failed'
    
    // Parse agent
    const agentMatch = entryBlock.match(/\*\*Agent:\*\*\s+(.+?)\s+\(/)
    const agentName = agentMatch?.[1] || 'Unknown'
    
    // Parse agent ID
    const agentIdMatch = entryBlock.match(/\(([^)]+)\)/)
    const agentId = agentIdMatch?.[1] || 'unknown'
    
    // Parse files
    const filesMatch = entryBlock.match(/\*\*Files Modified:\*\*\n([\s\S]*?)(?:\n\n|\*\*Summary)/)
    const filesText = filesMatch?.[1] || ''
    const filesModified = filesText
      .split('\n')
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line && line !== 'None')
    
    // Parse summary
    const summaryMatch = entryBlock.match(/\*\*Summary:\*\*\n([\s\S]*?)(?:\n\n\*\*Key Points|\n\n---)/)
    const summary = summaryMatch?.[1]?.trim() || ''
    
    // Parse key points
    const keyPointsMatch = entryBlock.match(/\*\*Key Points:\*\*\n([\s\S]*?)(?:\n\n---|$)/)
    const keyPointsText = keyPointsMatch?.[1] || ''
    const keyPoints = keyPointsText
      .split('\n')
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line && line !== 'Task completed')
    
    entries.push({
      timestamp,
      taskId: `historical-${entries.length}`,
      taskTitle,
      agentId,
      agentName,
      status: status as 'completed' | 'failed',
      filesModified,
      summary,
      keyPoints
    })
  }
  
  return entries
}

/**
 * Format memory for injection into task prompt
 */
export function formatMemoryForPrompt(memory: string): string {
  if (!memory || memory.trim().length === 0) {
    return '(No previous memory recorded for this project)'
  }
  
  // Limit memory to avoid overwhelming the prompt
  const maxLength = 4000
  let formatted = memory
  
  if (memory.length > maxLength) {
    // Keep the header and most recent entries
    const lines = memory.split('\n')
    const header: string[] = []
    const entries: string[] = []
    let inHeader = true
    
    for (const line of lines) {
      if (line.startsWith('### ')) {
        inHeader = false
      }
      if (inHeader) {
        header.push(line)
      } else {
        entries.push(line)
      }
    }
    
    // Take header + last entries that fit
    formatted = header.join('\n') + '\n\n[... earlier entries truncated ...]\n\n'
    
    // Add entries from the end until we hit the limit
    let currentLength = formatted.length
    const recentEntries: string[] = []
    
    for (let i = entries.length - 1; i >= 0; i--) {
      const entryLine = entries[i] + '\n'
      if (currentLength + entryLine.length > maxLength) {
        break
      }
      recentEntries.unshift(entryLine)
      currentLength += entryLine.length
    }
    
    formatted += recentEntries.join('')
  }
  
  return formatted
}

/**
 * Initialize MEMORY.md with header if it doesn't exist
 */
export async function initializeMemory(projectPath: string, projectName: string): Promise<void> {
  const memoryPath = path.join(projectPath, 'MEMORY.md')
  
  if (!fs.existsSync(memoryPath)) {
    const header = `# ${projectName} - Project Memory

## Recent Changes (Auto-generated from tasks)

## Key Decisions
<!-- Manually edited or auto-extracted -->

## Learnings
<!-- Best practices discovered -->

## Context
<!-- Current state -->
- Last Task: -
- Current Focus: -
- Blockers: None
- Next Steps: -

## Technical Debt
<!-- Things to fix later -->

## References

`
    fs.mkdirSync(projectPath, { recursive: true })
    fs.writeFileSync(memoryPath, header, 'utf-8')
    console.log(`[Memory] Initialized MEMORY.md at ${memoryPath}`)
  }
}

/**
 * Initialize MEMORY.md synchronously
 */
export function initializeMemorySync(projectPath: string, projectName: string): void {
  const memoryPath = path.join(projectPath, 'MEMORY.md')
  
  if (!fs.existsSync(memoryPath)) {
    const header = `# ${projectName} - Project Memory

## Recent Changes (Auto-generated from tasks)

## Key Decisions
<!-- Manually edited or auto-extracted -->

## Learnings
<!-- Best practices discovered -->

## Context
<!-- Current state -->
- Last Task: -
- Current Focus: -
- Blockers: None
- Next Steps: -

## Technical Debt
<!-- Things to fix later -->

## References

`
    fs.mkdirSync(projectPath, { recursive: true })
    fs.writeFileSync(memoryPath, header, 'utf-8')
    console.log(`[Memory] Initialized MEMORY.md at ${memoryPath}`)
  }
}

/**
 * Log task completion to memory
 * GROUND RULE: Call this when a task completes
 */
export async function logTaskToMemory(
  task: Task,
  result: TaskResult,
  agentName?: string,
  projectInfo?: { name: string; workspace?: string; path?: string }
): Promise<void> {
  console.log(`[Memory] ==========================================`)
  console.log(`[Memory] Logging task ${task.id} to MEMORY.md`)
  console.log(`[Memory] Project: ${projectInfo?.name || 'unknown'}`)
  console.log(`[Memory] Workspace: ${projectInfo?.workspace || projectInfo?.path || 'unknown'}`)
  
  try {
    // Get project path from provided info or fallback
    const projectPath = projectInfo?.workspace || projectInfo?.path
    if (!projectPath) {
      console.warn(`[Memory] Cannot log task ${task.id}: project path not found`)
      return
    }
    
    console.log(`[Memory] Target path: ${projectPath}`)
    
    // Ensure memory file exists
    await initializeMemory(projectPath, projectInfo.name || 'Project')
    
    // Generate and append entry
    const entryMarkdown = generateMemoryEntry(task, result, agentName || task.agentId)
    console.log(`[Memory] Generated entry (${entryMarkdown.length} chars)`)
    
    await appendToMemoryFile(projectPath, entryMarkdown)
    
    console.log(`[Memory] ✓ Task ${task.id} logged to MEMORY.md`)
    console.log(`[Memory] ==========================================`)
  } catch (error) {
    console.error(`[Memory] ✗ Failed to log task ${task.id}:`, error)
    console.log(`[Memory] ==========================================`)
    // Don't throw - memory logging should not break task completion
  }
}

// Export all memory functions
export const memory = {
  readMemory,
  readMemorySync,
  appendMemoryEntry,
  appendToMemoryFile,
  getRecentMemory,
  formatMemoryForPrompt,
  generateMemoryEntry,
  extractKeyPoints,
  formatMemoryDate,
  initializeMemory,
  initializeMemorySync,
  logTaskToMemory
}

export default memory
