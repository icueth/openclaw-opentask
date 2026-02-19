# ARCHITECTURE.md - Team-based Sub-agent System with Project Isolation

## Overview

This document describes the architecture for a Team-based Sub-agent System that enables:
1. **Team Role System** - Define reusable agent roles with specialized configurations
2. **Project Isolation** - Each project has isolated memory, tasks, and artifacts
3. **Assignment System** - Assign roles to work on specific projects

---

## 1. Data Models (TypeScript Interfaces)

### 1.1 Team Role System

```typescript
// ============================================================================
// ROLE DEFINITIONS - Reusable agent templates
// ============================================================================

interface TeamRole {
  id: string;                          // Unique identifier (e.g., 'coder', 'researcher')
  name: string;                        // Display name (e.g., 'Code Specialist')
  emoji: string;                       // Visual identifier (e.g., '👨‍💻')
  description: string;                 // What this role does
  specialty: string[];                 // Keywords for matching (e.g., ['typescript', 'react'])
  
  // Model Configuration
  modelConfig: {
    model: string;                     // Default model (e.g., 'kimi-coding/k2p5')
    thinking: 'off' | 'low' | 'medium' | 'high';
    timeout: number;                   // seconds, default 300
    temperature?: number;
    maxTokens?: number;
  };
  
  // Capabilities
  skills: string[];                    // Allowed skills/tools (e.g., ['read', 'edit', 'exec'])
  
  // Prompting
  systemPromptTemplate: string;        // Template with {{variables}}
  variables: string[];                 // Required template variables
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  version: number;
}

// Pre-defined role templates
interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  baseRole: TeamRole;                  // Copy as base, modify as needed
}

// Built-in templates
const BUILTIN_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'coder',
    name: 'Code Specialist',
    description: 'Expert in writing, reviewing, and debugging code',
    baseRole: {
      id: 'coder',
      name: 'Code Specialist',
      emoji: '👨‍💻',
      description: 'Expert programmer focused on code quality',
      specialty: ['typescript', 'javascript', 'python', 'code-review'],
      modelConfig: {
        model: 'kimi-coding/k2p5',
        thinking: 'high',
        timeout: 600,
      },
      skills: ['read', 'edit', 'write', 'exec', 'web_search', 'web_fetch'],
      systemPromptTemplate: `You are a {{specialty}} specialist.
Your task: {{task}}
Project: {{projectName}}
Work in: {{workDir}}

Follow the project guidelines and maintain code quality.
Always verify your changes compile before finishing.`,
      variables: ['specialty', 'task', 'projectName', 'workDir'],
      createdAt: '',
      updatedAt: '',
      version: 1,
    }
  },
  {
    id: 'researcher',
    name: 'Research Analyst',
    description: 'Gathers information and analyzes topics',
    baseRole: {
      id: 'researcher',
      name: 'Research Analyst',
      emoji: '🔍',
      description: 'Research specialist for gathering information',
      specialty: ['research', 'analysis', 'documentation'],
      modelConfig: {
        model: 'kimi-coding/k2p5',
        thinking: 'high',
        timeout: 300,
      },
      skills: ['web_search', 'web_fetch', 'read', 'write'],
      systemPromptTemplate: `You are a research analyst.
Research topic: {{task}}
Project: {{projectName}}

Find comprehensive, accurate information.
Cite sources and provide structured findings.`,
      variables: ['task', 'projectName'],
      createdAt: '',
      updatedAt: '',
      version: 1,
    }
  },
  {
    id: 'reviewer',
    name: 'Code Reviewer',
    description: 'Reviews code for quality, security, and best practices',
    baseRole: {
      id: 'reviewer',
      name: 'Code Reviewer',
      emoji: '🔐',
      description: 'Security and quality reviewer',
      specialty: ['security', 'review', 'best-practices'],
      modelConfig: {
        model: 'kimi-coding/k2p5',
        thinking: 'high',
        timeout: 300,
      },
      skills: ['read', 'web_search'],
      systemPromptTemplate: `You are a code reviewer.
Review task: {{task}}
Project: {{projectName}}

Check for: security issues, bugs, performance, maintainability.
Provide actionable feedback.`,
      variables: ['task', 'projectName'],
      createdAt: '',
      updatedAt: '',
      version: 1,
    }
  },
  {
    id: 'designer',
    name: 'UI/UX Designer',
    description: 'Creates user interfaces and experiences',
    baseRole: {
      id: 'designer',
      name: 'UI/UX Designer',
      emoji: '🎨',
      description: 'Design specialist for UI/UX',
      specialty: ['ui', 'ux', 'css', 'tailwind'],
      modelConfig: {
        model: 'kimi-coding/k2p5',
        thinking: 'medium',
        timeout: 300,
      },
      skills: ['read', 'edit', 'write', 'web_search'],
      systemPromptTemplate: `You are a UI/UX designer.
Design task: {{task}}
Project: {{projectName}}

Focus on user experience, accessibility, and visual consistency.`,
      variables: ['task', 'projectName'],
      createdAt: '',
      updatedAt: '',
      version: 1,
    }
  },
  {
    id: 'devops',
    name: 'DevOps Engineer',
    description: 'Infrastructure, CI/CD, and deployment',
    baseRole: {
      id: 'devops',
      name: 'DevOps Engineer',
      emoji: '🚀',
      description: 'DevOps and infrastructure specialist',
      specialty: ['docker', 'ci-cd', 'deployment', 'infrastructure'],
      modelConfig: {
        model: 'kimi-coding/k2p5',
        thinking: 'medium',
        timeout: 400,
      },
      skills: ['read', 'edit', 'write', 'exec', 'web_search'],
      systemPromptTemplate: `You are a DevOps engineer.
Task: {{task}}
Project: {{projectName}}
Work in: {{workDir}}

Ensure infrastructure is reliable, scalable, and secure.
Test configurations before applying.`,
      variables: ['task', 'projectName', 'workDir'],
      createdAt: '',
      updatedAt: '',
      version: 1,
    }
  },
  {
    id: 'tester',
    name: 'QA Engineer',
    description: 'Writes and runs tests, ensures quality',
    baseRole: {
      id: 'tester',
      name: 'QA Engineer',
      emoji: '🧪',
      description: 'Quality assurance and testing specialist',
      specialty: ['testing', 'qa', 'automation'],
      modelConfig: {
        model: 'kimi-coding/k2p5',
        thinking: 'high',
        timeout: 400,
      },
      skills: ['read', 'edit', 'write', 'exec'],
      systemPromptTemplate: `You are a QA engineer.
Testing task: {{task}}
Project: {{projectName}}
Work in: {{workDir}}

Write comprehensive tests covering edge cases.
Ensure code coverage and reliability.`,
      variables: ['task', 'projectName', 'workDir'],
      createdAt: '',
      updatedAt: '',
      version: 1,
    }
  },
];
```

### 1.2 Project Isolation System

```typescript
// ============================================================================
// PROJECT ISOLATION - Each project is self-contained
// ============================================================================

interface Project {
  id: string;                          // URL-friendly identifier
  name: string;                        // Display name
  description: string;
  
  // Project Configuration
  config: ProjectConfig;
  
  // Isolated Storage Paths (relative to ~/.openclaw/workspace/projects/{id}/)
  paths: {
    root: string;                      // Project root
    memory: string;                    // MEMORY.md path
    tasks: string;                     // TASKS/ folder
    artifacts: string;                 // ARTIFACTS/ folder
    context: string;                   // Additional context files
  };
  
  // Assigned Team
  team: ProjectTeamAssignment[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'completed';
}

interface ProjectConfig {
  // Tech Stack
  techStack: {
    languages: string[];
    frameworks: string[];
    tools: string[];
  };
  
  // Goals & Scope
  goals: string[];
  scope: {
    in: string[];                      // What's included
    out: string[];                     // What's explicitly excluded
  };
  
  // Constraints
  constraints: {
    maxTokensPerTask?: number;
    defaultTimeout?: number;
    requireReview?: boolean;
    allowedEnvironments?: string[];
  };
  
  // Integration
  repoUrl?: string;
  branch?: string;
  envFiles?: string[];
}

// Project Team Assignment - Links roles to projects
interface ProjectTeamAssignment {
  id: string;                          // Assignment ID
  roleId: string;                      // Reference to TeamRole
  projectId: string;
  
  // Overrides
  modelConfig?: Partial<TeamRole['modelConfig']>;
  skills?: string[];                   // Additional or restricted skills
  
  // Status
  status: 'active' | 'paused';
  assignedAt: string;
}
```

### 1.3 Task System

```typescript
// ============================================================================
// TASKS - Individual work items
// ============================================================================

interface Task {
  id: string;
  projectId: string;
  
  // Task Definition
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'research' | 'review' | 'refactor' | 'docs';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Assignment
  assignedRoleId?: string;             // Which role should handle this
  assignedSubAgentId?: string;         // Once spawned, track the sub-agent
  
  // Context
  context: {
    files: string[];                   // Relevant files
    codeRefs: string[];                // Code snippets or references
    dependencies: string[];            // Related task IDs
  };
  
  // Status
  status: 'pending' | 'assigned' | 'in-progress' | 'review' | 'done' | 'cancelled';
  
  // Lifecycle
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  
  // Results
  result?: {
    summary: string;
    filesChanged: string[];
    artifactsCreated: string[];
  };
}

// Task File Format (stored in TASKS/{id}.md)
interface TaskFileFormat {
  frontmatter: {
    id: string;
    status: Task['status'];
    priority: Task['priority'];
    assigned: string;
    created: string;
    updated: string;
  };
  content: string;                     // Markdown body
}
```

### 1.4 Spawn Request

```typescript
// ============================================================================
// SPAWN REQUEST - API payload for spawning sub-agents
// ============================================================================

interface SpawnRequest {
  // Required
  projectId: string;                   // Target project
  roleId: string;                      // Role to spawn
  taskId?: string;                     // Optional: specific task
  
  // Task Definition (if taskId not provided)
  task: {
    title: string;
    description: string;
    type: Task['type'];
    priority?: Task['priority'];
    context?: Task['context'];
  };
  
  // Overrides (optional)
  overrides?: {
    model?: string;
    thinking?: TeamRole['modelConfig']['thinking'];
    timeout?: number;
    skills?: string[];
  };
  
  // Options
  options: {
    waitForCompletion: boolean;        // Sync or async
    notifyOnComplete: boolean;         // Send notification
    createArtifact: boolean;           // Save result to ARTIFACTS/
  };
}

interface SpawnResponse {
  success: boolean;
  sessionId: string;                   // Sub-agent session ID
  taskId: string;                      // Created/updated task ID
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: {
    output: string;
    artifacts: string[];
    duration: number;
  };
  error?: string;
}
```

---

## 2. File Structure for Project Isolation

```
~/.openclaw/workspace/
├── TEAM.md                           # Global team definitions (existing)
├── ROLES.json                        # Role definitions storage (NEW)
├── projects/
│   └── {project-id}/
│       ├── PROJECT.md                # Project overview (markdown)
│       ├── PROJECT.json              # Machine-readable config
│       ├── MEMORY.md                 # Persistent project memory
│       ├── TEAM.md                   # Project-specific team assignments
│       ├── TASKS/
│       │   ├── README.md             # Task board overview
│       │   ├── todo/
│       │   │   ├── TASK-001.md
│       │   │   └── TASK-002.md
│       │   ├── in-progress/
│       │   │   └── TASK-003.md
│       │   ├── review/
│       │   │   └── TASK-004.md
│       │   └── done/
│       │       └── TASK-000.md
│       ├── ARTIFACTS/
│       │   ├── README.md
│       │   ├── 2026-02-17/
│       │   │   ├── research-findings.md
│       │   │   └── code-review-report.md
│       │   └── 2026-02-16/
│       │       └── design-proposal.md
│       └── CONTEXT/                  # Additional context (optional)
│           ├── API-SCHEMA.md
│           ├── STYLE-GUIDE.md
│           └── REQUIREMENTS.md
└── agents/                           # Existing agent configs
    └── {agent-id}/
        └── TEAM.md
```

### 2.1 PROJECT.md Template

```markdown
# {Project Name}

## Overview
{High-level description of the project}

## Tech Stack
- **Languages:** TypeScript, Python
- **Frameworks:** Next.js 14, FastAPI
- **Tools:** Docker, PostgreSQL

## Goals
1. {Primary goal}
2. {Secondary goal}

## Scope
### In Scope
- {What's included}

### Out of Scope  
- {What's excluded}

## Team Assignments
| Role | Status | Assigned |
|------|--------|----------|
| Coder | Active | Auto |
| Reviewer | Active | On-Demand |

---
*Created: {date}*
*Updated: {date}*
```

### 2.2 MEMORY.md Template

```markdown
# Project Memory

## Key Decisions
- {Decision} - {Date} - {Rationale}

## Important Context
- {Context that sub-agents should know}

## Lessons Learned
- {What worked well}
- {What to avoid}

## Active Threads
- {Ongoing work or concerns}

---
*Last updated: {date}*
```

### 2.3 TASK File Format (TASKS/{status}/TASK-{id}.md)

```markdown
---
id: TASK-001
status: todo
priority: high
assigned: coder
role: coder
created: 2026-02-17T10:00:00Z
updated: 2026-02-17T10:00:00Z
project: my-project
---

# {Task Title}

## Description
{Detailed description}

## Context
- Files: `src/app/api/route.ts`, `src/lib/api.ts`
- Related: TASK-000

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes
{Additional notes}
```

---

## 3. API Flow for Spawning Sub-agents

### 3.1 Sequence Diagram

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐     ┌────────────┐
│  Client │     │  Dashboard   │     │   Gateway   │     │   Project   │     │  Sub-agent │
└────┬────┘     └──────┬───────┘     └──────┬──────┘     └──────┬──────┘     └─────┬──────┘
     │                 │                    │                   │                  │
     │ POST /api/team/spawn                │                   │                  │
     │ {projectId, roleId, task}           │                   │                  │
     │────────────────>│                   │                   │                  │
     │                 │                   │                   │                  │
     │                 │ 1. Load Role      │                   │                  │
     │                 │    from ROLES.json│                   │                  │
     │                 │──────────────────>│                   │                  │
     │                 │<──────────────────│                   │                  │
     │                 │                   │                   │                  │
     │                 │ 2. Load Project   │                   │                  │
     │                 │    Context        │                   │                  │
     │                 │──────────────────────────────────────>│                  │
     │                 │<──────────────────────────────────────│                  │
     │                 │                   │                   │                  │
     │                 │ 3. Create Task    │                   │                  │
     │                 │──────────────────────────────────────>│                  │
     │                 │<──────────────────────────────────────│                  │
     │                 │                   │                   │                  │
     │                 │ 4. Build Prompt   │                   │                  │
     │                 │    (system + task)│                   │                  │
     │                 │                   │                   │                  │
     │                 │ 5. Call Gateway   │                   │                  │
     │                 │    /api/sessions/spawn                │                  │
     │                 │────────────────>│                   │                  │
     │                 │                   │                   │                  │
     │                 │                   │ 6. Spawn Sub-agent│                  │
     │                 │                   │────────────────────────────────────>│
     │                 │                   │                   │                  │
     │                 │ 7. Update Task    │                   │                  │
     │                 │    with sessionId │                   │                  │
     │                 │──────────────────────────────────────>│                  │
     │                 │<──────────────────────────────────────│                  │
     │                 │                   │                   │                  │
     │<────────────────│ {sessionId, taskId}                   │                  │
     │                 │                   │                   │                  │
     │                 │                   │                   │                  │
     │                 │                   │<────────────────────────────────────│
     │                 │                   │ 8. Completion     │                  │
     │                 │                   │   (async webhook) │                  │
     │                 │                   │                   │                  │
     │                 │ 9. Save Artifacts │                   │                  │
     │                 │──────────────────────────────────────>│                  │
     │                 │<──────────────────────────────────────│                  │
     │                 │                   │                   │                  │
```

### 3.2 API Endpoints

#### Core Endpoints (Existing + New)

```typescript
// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

// GET /api/roles
// Returns all role definitions
Response: { roles: TeamRole[] }

// GET /api/roles/:id
// Returns specific role
Response: { role: TeamRole }

// POST /api/roles
// Create new role
Body: Omit<TeamRole, 'createdAt' | 'updatedAt' | 'version'>
Response: { success: true, role: TeamRole }

// PUT /api/roles/:id
// Update role
Body: Partial<TeamRole>
Response: { success: true, role: TeamRole }

// DELETE /api/roles/:id
// Delete role (cannot delete if assigned)
Response: { success: true }

// GET /api/roles/templates
// Returns built-in templates
Response: { templates: RoleTemplate[] }

// ============================================================================
// PROJECT MANAGEMENT (Extends existing /api/projects)
// ============================================================================

// GET /api/projects
// Returns all projects with summary
Response: { 
  projects: Array<{
    id: string;
    name: string;
    description: string;
    status: Project['status'];
    taskCount: { todo: number; inProgress: number; done: number };
    teamSize: number;
  }> 
}

// GET /api/projects/:id
// Returns full project with files
Response: { project: Project & { files: any[] } }

// POST /api/projects
// Create new project (enhanced)
Body: {
  id: string;
  name: string;
  description?: string;
  techStack?: ProjectConfig['techStack'];
  goals?: string[];
}
Response: { success: true, project: Project }

// PUT /api/projects/:id
// Update project config
Body: Partial<Project>
Response: { success: true, project: Project }

// DELETE /api/projects/:id
// Archive/delete project
Response: { success: true }

// ============================================================================
// PROJECT TEAM ASSIGNMENTS
// ============================================================================

// GET /api/projects/:id/team
// Returns assigned roles for this project
Response: { assignments: ProjectTeamAssignment[] }

// POST /api/projects/:id/team
// Assign a role to project
Body: {
  roleId: string;
  modelConfig?: Partial<TeamRole['modelConfig']>;
  skills?: string[];
}
Response: { success: true, assignment: ProjectTeamAssignment }

// DELETE /api/projects/:id/team/:assignmentId
// Remove role from project
Response: { success: true }

// ============================================================================
// PROJECT TASKS
// ============================================================================

// GET /api/projects/:id/tasks
// Returns all tasks (optionally filter by status)
Query: ?status=todo|in-progress|review|done
Response: { tasks: Task[] }

// GET /api/projects/:id/tasks/:taskId
// Returns specific task
Response: { task: Task }

// POST /api/projects/:id/tasks
// Create new task
Body: Omit<Task, 'id' | 'createdAt' | 'projectId'>
Response: { success: true, task: Task }

// PUT /api/projects/:id/tasks/:taskId
// Update task
Body: Partial<Task>
Response: { success: true, task: Task }

// POST /api/projects/:id/tasks/:taskId/move
// Move task between statuses
Body: { status: Task['status'] }
Response: { success: true }

// ============================================================================
// SPAWN (Extends existing /api/team/spawn)
// ============================================================================

// POST /api/team/spawn (ENHANCED)
Body: SpawnRequest
Response: SpawnResponse

// GET /api/team/spawn/:sessionId/status
// Check spawn status
Response: { 
  status: SpawnResponse['status'];
  progress?: number;
  result?: SpawnResponse['result'];
}
```

### 3.3 Prompt Building Logic

```typescript
// ============================================================================
// PROMPT BUILDER
// ============================================================================

interface PromptBuildInput {
  role: TeamRole;
  project: Project;
  task: Task;
  contextFiles?: string[];
}

async function buildSpawnPrompt(input: PromptBuildInput): Promise<string> {
  const { role, project, task, contextFiles } = input;
  
  // 1. Build variable map
  const variables: Record<string, string> = {
    roleName: role.name,
    roleDescription: role.description,
    specialty: role.specialty.join(', '),
    projectName: project.name,
    projectDescription: project.description,
    projectPath: project.paths.root,
    workDir: project.paths.root,
    taskTitle: task.title,
    taskDescription: task.description,
    taskType: task.type,
    techStack: project.config.techStack.languages.join(', '),
  };
  
  // 2. Substitute template variables
  let systemPrompt = role.systemPromptTemplate;
  for (const [key, value] of Object.entries(variables)) {
    systemPrompt = systemPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  // 3. Load project context
  const projectMemory = await loadFile(project.paths.memory);
  const projectOverview = await loadFile(`${project.paths.root}/PROJECT.md`);
  
  // 4. Load relevant context files
  let contextContent = '';
  if (contextFiles?.length) {
    const contents = await Promise.all(
      contextFiles.map(f => loadFile(`${project.paths.root}/${f}`))
    );
    contextContent = contents.join('\n\n---\n\n');
  }
  
  // 5. Load task-specific files
  const taskFiles = task.context.files || [];
  const taskFileContents = await Promise.all(
    taskFiles.map(f => loadFile(`${project.paths.root}/${f}`).catch(() => ''))
  );
  
  // 6. Assemble final prompt
  const finalPrompt = `${systemPrompt}

# Project Context

## Overview
${projectOverview}

## Memory
${projectMemory}

## Relevant Context
${contextContent}

## Task Files
${taskFiles.map((f, i) => `### ${f}\n${taskFileContents[i]}`).join('\n\n')}

# Your Task

**Title:** ${task.title}
**Type:** ${task.type}
**Priority:** ${task.priority}

${task.description}

## Acceptance Criteria
${task.context.codeRefs?.map(ref => `- ${ref}`).join('\n') || '- Complete the task as described'}

---
Work in: ${project.paths.root}
When complete, update the task file at: TASKS/in-progress/${task.id}.md
`;

  return finalPrompt;
}
```

---

## 4. Database Schema

Since we're using a file-based approach (consistent with existing dashboard), we don't need a traditional database. However, for scaling or if we want to add search/filtering capabilities, here's an optional SQLite schema:

```sql
-- ============================================================================
-- OPTIONAL: SQLite Schema for enhanced queries
-- Stored at: ~/.openclaw/workspace/.dashboard.db
-- ============================================================================

-- Role definitions (synced from ROLES.json)
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  specialty TEXT, -- JSON array
  model_config TEXT, -- JSON
  skills TEXT, -- JSON array
  system_prompt_template TEXT,
  variables TEXT, -- JSON array
  created_at TEXT,
  updated_at TEXT,
  version INTEGER DEFAULT 1
);

-- Projects (synced from projects/*/PROJECT.json)
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  config TEXT, -- JSON
  paths TEXT, -- JSON
  status TEXT DEFAULT 'active',
  created_at TEXT,
  updated_at TEXT
);

-- Project team assignments
CREATE TABLE project_assignments (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  role_id TEXT REFERENCES roles(id),
  model_config_override TEXT, -- JSON
  skills_override TEXT, -- JSON
  status TEXT DEFAULT 'active',
  assigned_at TEXT
);

-- Tasks (synced from projects/*/TASKS/)
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  priority TEXT,
  assigned_role_id TEXT REFERENCES roles(id),
  assigned_sub_agent_id TEXT,
  context TEXT, -- JSON
  status TEXT DEFAULT 'pending',
  created_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  result TEXT -- JSON
);

-- Spawn sessions (for tracking)
CREATE TABLE spawn_sessions (
  session_id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id),
  project_id TEXT REFERENCES projects(id),
  role_id TEXT REFERENCES roles(id),
  status TEXT,
  started_at TEXT,
  completed_at TEXT,
  duration_seconds INTEGER,
  output TEXT,
  artifacts TEXT -- JSON array
);

-- Full-text search index for tasks
CREATE VIRTUAL TABLE tasks_fts USING fts5(
  title,
  description,
  content='tasks',
  content_rowid='rowid'
);

-- Indexes for common queries
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_role_id);
CREATE INDEX idx_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_sessions_task ON spawn_sessions(task_id);
```

---

## 5. Integration with Existing Code

### 5.1 File Changes Required

| File | Change | Description |
|------|--------|-------------|
| `/api/team/spawn/route.ts` | Modify | Enhance to accept projectId, build prompts |
| `/api/roles/route.ts` | Create | CRUD for role definitions |
| `/api/projects/route.ts` | Modify | Enhance project creation with isolation |
| `/api/projects/[id]/team/route.ts` | Create | Project team assignments |
| `/api/projects/[id]/tasks/route.ts` | Create | Task management |
| `/api/projects/[id]/spawn/route.ts` | Create | Project-specific spawn endpoint |
| `ROLES.json` | Create | Role definitions storage |

### 5.2 Backward Compatibility

- Existing `/api/team/spawn` continues to work
- Existing projects without isolation work as before
- New features are opt-in via project configuration

---

## 6. Security Considerations

1. **Skill Restrictions**: Roles define allowed tools; sub-agents can't use unlisted skills
2. **Path Isolation**: Sub-agents work within their project path
3. **Env Protection**: Environment files can be excluded from context
4. **Review Gates**: Optional human review before applying changes
5. **Audit Trail**: All spawns and changes logged

---

*Architecture Version: 1.0*
*Last Updated: 2026-02-17*
