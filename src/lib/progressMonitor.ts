import fs from 'fs'
import path from 'path'

const PROGRESS_DIR = path.join(process.cwd(), 'data', 'task-contexts')

export function readProgressLog(taskId: string): { percentage: number; message: string; timestamp?: number } | null {
  try {
    const progressFile = path.join(PROGRESS_DIR, `${taskId}.progress`)
    if (!fs.existsSync(progressFile)) {
      return null
    }
    const content = fs.readFileSync(progressFile, 'utf-8')
    return JSON.parse(content)
  } catch (e) {
    return null
  }
}

export function writeProgressLog(taskId: string, percentage: number, message: string, exitCode?: number): void {
  try {
    fs.mkdirSync(PROGRESS_DIR, { recursive: true })
    const progressFile = path.join(PROGRESS_DIR, `${taskId}.progress`)
    const data: any = { percentage, message, timestamp: Date.now() }
    if (exitCode !== undefined) {
      data.exitCode = exitCode
    }
    fs.writeFileSync(progressFile, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to write progress log:', e)
  }
}

export function initProgressLog(taskId: string): void {
  writeProgressLog(taskId, 0, 'Starting...')
}

export function parseProgressFromOutput(output: string): { percentage: number; message: string } | null {
  const match = output.match(/PROGRESS:\s*(\d+)%\s*-\s*(.+)/)
  if (match) {
    return { percentage: parseInt(match[1]), message: match[2].trim() }
  }
  return null
}

export function updateTaskProgressWithLog(taskId: string, percentage: number, message: string): void {
  writeProgressLog(taskId, percentage, message)
}

export function createProgressWrapperScript(
  taskId: string,
  cliPath: string,
  agentId: string,
  promptFile: string,
  thinking: string,
  timeoutMinutes: number,
  logFile: string,
  projectPath: string,
  projectId: string
): string {
  const timeoutSec = timeoutMinutes * 60
  const progressFile = path.join(PROGRESS_DIR, `${taskId}.progress`)
  
  // Simple approach - use Node.js to write JSON to avoid bash escaping issues
  const nodeScriptPath = path.join(PROGRESS_DIR, `${taskId}-progress-helper.js`)
  
  // Create a Node.js helper script for writing progress
  const nodeScript = `
const fs = require('fs');
const path = require('path');
const progressFile = '${progressFile}';
function writeProgress(pct, msg) {
  const data = { percentage: parseInt(pct), message: msg, timestamp: Date.now() };
  fs.writeFileSync(progressFile, JSON.stringify(data));
  console.log('PROGRESS: ' + pct + '% - ' + msg);
}
const [,, pct, msg] = process.argv;
writeProgress(pct, msg);
`
  fs.writeFileSync(nodeScriptPath, nodeScript)
  
  // Build bash script
  const lines: string[] = []
  
  lines.push('#!/bin/bash')
  lines.push('# Task: ' + taskId)
  lines.push('LOG_FILE="' + logFile + '"')
  lines.push('PROGRESS_FILE="' + progressFile + '"')
  lines.push('NODE_SCRIPT="' + nodeScriptPath + '"')
  lines.push('')
  lines.push('echo "=== Task ' + taskId + ' started at $(date) ===" > "$LOG_FILE"')
  lines.push('')
  lines.push('# Progress reporting function using Node.js helper')
  lines.push('report_progress() {')
  lines.push('  node "$NODE_SCRIPT" "$1" "$2"')
  lines.push('}')
  lines.push('')
  lines.push('# Report initial progress')
  lines.push('report_progress 10 "🚀 Agent started"')
  lines.push('')
  lines.push('# Start time')
  lines.push('START_TIME=$(date +%s)')
  lines.push('TIMEOUT_SEC=' + timeoutSec)
  lines.push('')
  lines.push('# Run agent with progress monitoring')
  lines.push(cliPath + ' agent --agent ' + agentId + ' --message "$(cat ' + promptFile + ')" --thinking ' + thinking + ' --timeout $TIMEOUT_SEC --json 2>&1 | tee -a "$LOG_FILE" &')
  lines.push('')
  lines.push('AGENT_PID=$!')
  lines.push('')
  lines.push('# Progress loop - update every 3 seconds')
  lines.push('while kill -0 $AGENT_PID 2>/dev/null; do')
  lines.push('  CURRENT_TIME=$(date +%s)')
  lines.push('  ELAPSED=$(( CURRENT_TIME - START_TIME ))')
  lines.push('  ')
  lines.push('  # Progress based on elapsed time')
  lines.push('  if [ $ELAPSED -lt 15 ]; then')
  lines.push('    report_progress 15 "📖 Reading task context..."')
  lines.push('  elif [ $ELAPSED -lt 30 ]; then')
  lines.push('    report_progress 25 "🤔 Analyzing requirements..."')
  lines.push('  elif [ $ELAPSED -lt 60 ]; then')
  lines.push('    report_progress 35 "📝 Working on solution..."')
  lines.push('  elif [ $ELAPSED -lt 90 ]; then')
  lines.push('    report_progress 45 "⚡ Processing files..."')
  lines.push('  elif [ $ELAPSED -lt 120 ]; then')
  lines.push('    report_progress 55 "🔧 Implementing changes..."')
  lines.push('  elif [ $ELAPSED -lt 150 ]; then')
  lines.push('    report_progress 65 "📄 Creating files..."')
  lines.push('  elif [ $ELAPSED -lt 180 ]; then')
  lines.push('    report_progress 75 "✏️  Editing content..."')
  lines.push('  elif [ $ELAPSED -lt 210 ]; then')
  lines.push('    report_progress 85 "🔍 Finalizing..."')
  lines.push('  else')
  lines.push('    report_progress 90 "⏳ Almost done..."')
  lines.push('  fi')
  lines.push('  ')
  lines.push('  sleep 3')
  lines.push('done')
  lines.push('')
  lines.push('# Wait for agent to finish')
  lines.push('wait $AGENT_PID')
  lines.push('EXIT_CODE=$?')
  lines.push('')
  lines.push('# Report final status')
  lines.push('if [ $EXIT_CODE -eq 0 ]; then')
  lines.push('  report_progress 100 "✅ Task completed successfully"')
  lines.push('  echo "=== Task completed at $(date) ===" >> "$LOG_FILE"')
  lines.push('else')
  lines.push('  report_progress 0 "❌ Task failed"')
  lines.push('  echo "=== Task failed at $(date) ===" >> "$LOG_FILE"')
  lines.push('fi')
  lines.push('')
  lines.push('# Cleanup helper script')
  lines.push('rm -f "$NODE_SCRIPT"')
  lines.push('')
  lines.push('exit $EXIT_CODE')
  
  return lines.join('\n')
}