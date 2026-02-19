/**
 * Data Persistence Layer for Dashboard
 * Uses JSON files in /data folder for simple persistence
 */

import fs from 'fs'
import path from 'path'

// Data directory path - can be overridden with env var for deployment
const DATA_DIR = process.env.DASHBOARD_DATA_DIR 
  ? path.resolve(process.env.DASHBOARD_DATA_DIR)
  : path.join(process.cwd(), 'data')

// File paths
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json')
const SPAWNS_FILE = path.join(DATA_DIR, 'spawns.json')
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json')

// Types
export interface Project {
  id: string
  name: string
  description: string
  agentId: string       // Agent assigned to this project
  workspace: string     // Full path: {DATA_DIR}/projects/{id}
  createdAt: string
  path: string
  githubUrl?: string
  githubRepoName?: string
}

// Project workspace directory - stored inside data folder for portability
export const PROJECTS_DIR = path.join(DATA_DIR, 'projects')

// Ensure projects directory exists
function ensureProjectsDir(): void {
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true })
  }
}

export interface SpawnRecord {
  id: string
  agentId: string
  projectId: string | null
  task: string
  status: 'spawning' | 'running' | 'completed' | 'failed'
  sessionKey?: string
  error?: string
  gatewayResponse?: any
  createdAt: string
  updatedAt?: string
}

// Ensure data directory exists
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Read JSON file with default
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue
    }
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return defaultValue
  }
}

// Write JSON file
function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDataDir()
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// --- Spawn Records CRUD ---

export function getSpawnRecords(): SpawnRecord[] {
  return readJsonFile<SpawnRecord[]>(SPAWNS_FILE, [])
}

export function getSpawnRecordById(id: string): SpawnRecord | undefined {
  const records = getSpawnRecords()
  return records.find(r => r.id === id)
}

export function addSpawnRecord(record: SpawnRecord): SpawnRecord {
  const records = getSpawnRecords()
  records.push(record)
  writeJsonFile(SPAWNS_FILE, records)
  return record
}

export function updateSpawnRecord(id: string, updates: Partial<SpawnRecord>): SpawnRecord {
  const records = getSpawnRecords()
  const index = records.findIndex(r => r.id === id)

  if (index === -1) {
    throw new Error(`Spawn record with id "${id}" not found`)
  }

  records[index] = {
    ...records[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  writeJsonFile(SPAWNS_FILE, records)
  return records[index]
}

export function deleteSpawnRecord(id: string): void {
  const records = getSpawnRecords()
  const index = records.findIndex(r => r.id === id)

  if (index === -1) {
    throw new Error(`Spawn record with id "${id}" not found`)
  }

  records.splice(index, 1)
  writeJsonFile(SPAWNS_FILE, records)
}

// --- Task Types ---

export interface ProgressUpdate {
  percentage: number
  message: string
  timestamp: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  agentId: string
  status: 'created' | 'pending' | 'active' | 'processing' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  startedAt?: string
  completedAt?: string
  assignedAgent?: string
  result?: string
  error?: string
  artifacts?: string[]
  retryCount?: number
  maxRetries?: number
  timeoutMinutes?: number
  statusHistory: StatusChange[]
  progress?: number
  progressUpdates?: ProgressUpdate[]
  currentStep?: string
}

export interface StatusChange {
  status: Task['status']
  timestamp: string
  message?: string
}

// --- Project CRUD ---

export function getProjects(): Project[] {
  return readJsonFile<Project[]>(PROJECTS_FILE, [])
}

export function getProjectById(id: string): Project | undefined {
  const projects = getProjects()
  return projects.find(p => p.id === id)
}

export function createProject(project: Project): Project {
  const projects = getProjects()

  // Check for duplicate ID
  if (projects.some(p => p.id === project.id)) {
    throw new Error(`Project with id "${project.id}" already exists`)
  }

  projects.push(project)
  writeJsonFile(PROJECTS_FILE, projects)
  return project
}

export function updateProject(id: string, updates: Partial<Project>): Project {
  const projects = getProjects()
  const index = projects.findIndex(p => p.id === id)

  if (index === -1) {
    throw new Error(`Project with id "${id}" not found`)
  }

  projects[index] = { ...projects[index], ...updates }
  writeJsonFile(PROJECTS_FILE, projects)
  return projects[index]
}

export function deleteProject(id: string): void {
  const projects = getProjects()
  const index = projects.findIndex(p => p.id === id)

  if (index === -1) {
    throw new Error(`Project with id "${id}" not found`)
  }

  projects.splice(index, 1)
  writeJsonFile(PROJECTS_FILE, projects)
}

// --- Task CRUD ---

export function getTasks(): Task[] {
  return readJsonFile<Task[]>(TASKS_FILE, [])
}

export function writeTasks(tasks: Task[]): void {
  writeJsonFile(TASKS_FILE, tasks)
}

export function getTasksByProjectId(projectId: string): Task[] {
  const tasks = getTasks()
  return tasks.filter(t => t.projectId === projectId)
}

export function getTaskById(id: string): Task | undefined {
  const tasks = getTasks()
  return tasks.find(t => t.id === id)
}

export function createTask(task: Task): Task {
  const tasks = getTasks()

  // Check for duplicate ID
  if (tasks.some(t => t.id === task.id)) {
    throw new Error(`Task with id "${task.id}" already exists`)
  }

  tasks.push(task)
  writeJsonFile(TASKS_FILE, tasks)
  return task
}

export function updateTask(id: string, updates: Partial<Task>): Task {
  const tasks = getTasks()
  const index = tasks.findIndex(t => t.id === id)

  if (index === -1) {
    throw new Error(`Task with id "${id}" not found`)
  }

  tasks[index] = { ...tasks[index], ...updates }
  writeJsonFile(TASKS_FILE, tasks)
  return tasks[index]
}

export function deleteTask(id: string): void {
  const tasks = getTasks()
  const index = tasks.findIndex(t => t.id === id)

  if (index === -1) {
    throw new Error(`Task with id "${id}" not found`)
  }

  tasks.splice(index, 1)
  writeJsonFile(TASKS_FILE, tasks)
}

// --- Progress Update Operations ---

export function updateTaskProgress(
  id: string,
  percentage: number,
  message: string
): Task {
  const tasks = getTasks()
  const index = tasks.findIndex(t => t.id === id)

  if (index === -1) {
    throw new Error(`Task with id "${id}" not found`)
  }

  const progressUpdate: ProgressUpdate = {
    percentage,
    message,
    timestamp: new Date().toISOString()
  }

  const existingUpdates = tasks[index].progressUpdates || []

  tasks[index] = {
    ...tasks[index],
    progress: percentage,
    currentStep: message,
    progressUpdates: [...existingUpdates, progressUpdate]
  }

  writeJsonFile(TASKS_FILE, tasks)
  return tasks[index]
}

export function clearTaskProgress(id: string): Task {
  const tasks = getTasks()
  const index = tasks.findIndex(t => t.id === id)

  if (index === -1) {
    throw new Error(`Task with id "${id}" not found`)
  }

  tasks[index] = {
    ...tasks[index],
    progress: undefined,
    progressUpdates: undefined,
    currentStep: undefined
  }

  writeJsonFile(TASKS_FILE, tasks)
  return tasks[index]
}

// --- In-Memory Store for Runtime Data ---
// Used for temporary data like subagent tracking
const memoryStore = new Map<string, any>()

export function set(key: string, value: any): void {
  memoryStore.set(key, value)
}

export function get(key: string): any {
  return memoryStore.get(key)
}

export function remove(key: string): boolean {
  return memoryStore.delete(key)
}

// Export store object for convenience
export const store = {
  // Projects
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  // Spawns
  getSpawnRecords,
  getSpawnRecordById,
  addSpawnRecord,
  updateSpawnRecord,
  deleteSpawnRecord,
  // Tasks
  getTasks,
  getTasksByProjectId,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  writeTasks,
  // Progress
  updateTaskProgress,
  clearTaskProgress,
  // Memory store
  set,
  get,
  remove
}

export default store