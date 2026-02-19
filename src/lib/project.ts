/**
 * Project Store - Simple JSON-based storage
 */

import { Project, CreateProjectData, UpdateProjectData } from '@/types/project'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

const DATA_DIR = join(process.cwd(), 'data')
const PROJECTS_FILE = join(DATA_DIR, 'projects.json')
const PROJECTS_DIR = join(DATA_DIR, 'projects')

// Ensure directories exist
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}
if (!existsSync(PROJECTS_DIR)) {
  mkdirSync(PROJECTS_DIR, { recursive: true })
}

// Read projects from file
function readProjects(): Project[] {
  try {
    if (!existsSync(PROJECTS_FILE)) {
      return []
    }
    const data = readFileSync(PROJECTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Failed to read projects:', error)
    return []
  }
}

// Write projects to file
function writeProjects(projects: Project[]): void {
  try {
    writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2))
  } catch (error) {
    console.error('Failed to write projects:', error)
    throw error
  }
}

// Get all projects
export function getProjects(): Project[] {
  return readProjects()
}

// Get project by ID
export function getProject(id: string): Project | null {
  const projects = readProjects()
  return projects.find(p => p.id === id) || null
}

// Create new project
export function createProject(data: CreateProjectData): Project {
  const projects = readProjects()
  
  const project: Project = {
    id: randomUUID(),
    name: data.name,
    description: data.description || '',
    path: join(PROJECTS_DIR, randomUUID()),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agentId: data.agentId
  }
  
  // Create project directory
  if (!existsSync(project.path)) {
    mkdirSync(project.path, { recursive: true })
  }
  
  // Create PROJECT.md
  const projectMd = `# ${project.name}

${project.description}

## Overview
<!-- Project overview -->

## Goals
- Goal 1
- Goal 2
- Goal 3

## Architecture
<!-- Describe the tech stack, architecture decisions -->

## Team
<!-- List team members and their roles -->

## Getting Started
<!-- Setup instructions, dependencies -->

---
*Created: ${project.createdAt}*
*Updated: ${project.updatedAt}*
`
  
  writeFileSync(join(project.path, 'PROJECT.md'), projectMd)
  
  projects.push(project)
  writeProjects(projects)
  
  return project
}

// Update project
export function updateProject(id: string, data: UpdateProjectData): Project | null {
  const projects = readProjects()
  const index = projects.findIndex(p => p.id === id)
  
  if (index === -1) {
    return null
  }
  
  projects[index] = {
    ...projects[index],
    ...data,
    updatedAt: new Date().toISOString()
  }
  
  writeProjects(projects)
  return projects[index]
}

// Delete project
export function deleteProject(id: string): boolean {
  const projects = readProjects()
  const filtered = projects.filter(p => p.id !== id)
  
  if (filtered.length === projects.length) {
    return false
  }
  
  writeProjects(filtered)
  return true
}
