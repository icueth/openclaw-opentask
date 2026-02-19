# PROJECT: Agent Management Dashboard

## Goal
สร้างระบบจัดการ Agent และ Sub-agent สำหรับ OpenClaw Dashboard พร้อมระบบ Project Isolation และ Team Role System

## Requirements

### 1. Agent Management (Existing)
- ดูรายการ agents ทั้งหมด
- เพิ่ม agent ใหม่
- แก้ไข agent (model, thinking, skills)
- ลบ agent
- ตั้งค่า default agent

### 2. Sub-agent Management (Existing)
- ดูรายการ sub-agents ที่ spawn แล้ว
- เพิ่ม sub-agent profile (programmer, tester, research, audit)
- แก้ไข sub-agent settings
- ลบ sub-agent profile

### 3. Model Management (Existing)
- ดู models ทั้งหมดจาก providers
- เลือก default model
- เพิ่ม custom model
- ตั้งค่า fallback models

### 4. Config Editor (Existing)
- อ่าน openclaw.json
- แก้ไข config (with validation)
- Apply config (restart gateway)
- Backup/restore config

### 5. Team Role System (NEW)
- กำหนด Roles (Coder, Researcher, Reviewer, etc.) พร้อม config:
  - Role name, description, specialty
  - Default model config (model, thinking, timeout)
  - Skills/tools allowed
  - System prompt template with variables
- ใช้ built-in templates หรือสร้าง custom roles
- จัดการ roles ผ่าน `/api/roles`
- เก็บ role definitions ใน `ROLES.json`

### 6. Project Isolation System (NEW)
- แต่ละ project มี isolated memory:
  - `PROJECT.md` - Project overview, tech stack, goals
  - `MEMORY.md` - Persistent memory for the project
  - `TASKS/` folder - Individual task files (todo/, in-progress/, review/, done/)
  - `ARTIFACTS/` folder - Generated outputs
- สร้าง project structure อัตโนมัติเมื่อสร้าง project
- อ่าน/เขียน project files ผ่าน API

### 7. Assignment System (NEW)
- กำหนดว่า role ใดทำงานบน project ใด
- Project-specific team assignments
- Override model config/skills ต่อ project ได้
- Spawn sub-agent พร้อม project context อัตโนมัติ

### 8. Task Management (NEW)
- สร้าง/แก้ไข/ลบ tasks ใน project
- Task status workflow: pending → assigned → in-progress → review → done
- ผูก task กับ role/sub-agent
- Task context: files, code refs, dependencies
- Markdown-based task files

### 9. Enhanced Spawn Flow (NEW)
- Spawn sub-agent พร้อม:
  - Auto-load project context (PROJECT.md, MEMORY.md)
  - Build system prompt จาก role template + variables
  - Create task record อัตโนมัติ
  - Save output to ARTIFACTS/
- Track spawn status และ results

### 10. API Standards
- ใช้ Gateway API endpoints
- Auth with gateway token
- Validate changes before apply
- RESTful API design

---

## Architecture

ดูรายละเอียดเต็มใน [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

### Data Models
- `TeamRole` - Role definition with model config, skills, prompt template
- `Project` - Project with isolated paths and team assignments
- `ProjectTeamAssignment` - Links roles to projects
- `Task` - Individual work items with status workflow
- `SpawnRequest/Response` - API payloads for spawning

### File Structure
```
~/.openclaw/workspace/
├── TEAM.md                    # Global team (existing)
├── ROLES.json                 # Role definitions (NEW)
└── projects/
    └── {project-id}/
        ├── PROJECT.md         # Project overview (NEW)
        ├── PROJECT.json       # Machine config (NEW)
        ├── MEMORY.md          # Persistent memory (NEW)
        ├── TEAM.md            # Project team assignments (NEW)
        ├── TASKS/             # Task files (NEW)
        │   ├── todo/
        │   ├── in-progress/
        │   ├── review/
        │   └── done/
        └── ARTIFACTS/         # Generated outputs (NEW)
```

---

## Files to Create/Modify

### API Routes (New)
- `/api/roles` - CRUD role definitions
- `/api/roles/[id]` - Single role ops
- `/api/roles/templates` - Built-in templates
- `/api/projects/[id]/team` - Project team assignments
- `/api/projects/[id]/tasks` - Task management
- `/api/projects/[id]/tasks/[taskId]` - Single task ops
- `/api/projects/[id]/spawn` - Project-specific spawn
- `/api/spawn/[sessionId]/status` - Spawn status tracking

### API Routes (Modify)
- `/api/team/spawn` - Enhance with project context
- `/api/projects` - Enhance with isolation setup
- `/api/projects/[id]` - Enhance with full project data

### Pages (New)
- `/roles` - Role management
- `/roles/new` - Create role
- `/roles/[id]/edit` - Edit role
- `/projects/[id]/tasks` - Task board
- `/projects/[id]/tasks/new` - Create task
- `/projects/[id]/team` - Project team assignments

### Components (New)
- `RoleCard.tsx` - Display role info
- `RoleForm.tsx` - Create/edit role
- `TaskBoard.tsx` - Kanban-style task board
- `TaskCard.tsx` - Task display
- `ProjectTeamManager.tsx` - Assign roles to project
- `SpawnWithContext.tsx` - Spawn dialog with context preview

---

## Tech Stack
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- OpenClaw Gateway API
- File-based storage (JSON + Markdown)

---

## Implementation Phases

### Phase 1: Role System
1. Create `ROLES.json` schema
2. Implement `/api/roles` endpoints
3. Create role management pages
4. Add built-in templates

### Phase 2: Project Isolation
1. Enhance project creation with isolation
2. Auto-create PROJECT.md, MEMORY.md, folders
3. Implement project file APIs
4. Create project context loader

### Phase 3: Assignment System
1. Project team assignment API
2. Assignment management UI
3. Override config per assignment

### Phase 4: Task Management
1. Task CRUD APIs
2. Task board UI
3. Task file generation

### Phase 5: Enhanced Spawn
1. Prompt builder service
2. Enhanced spawn API with context
3. Artifact saving
4. Status tracking

---

*Created: 2026-02-16*
*Updated: 2026-02-17 - Added Team Role System & Project Isolation*
