# Dashboard Flow Architecture Fix - Summary

## Changes Made

### 1. Sidebar Navigation (`/src/components/Sidebar.tsx`)
- Removed "Agents" from sidebar navigation
- Removed "Nodes" from sidebar navigation  
- Order: Dashboard → Team → Projects → Sessions → Logs → Settings

### 2. Team Role Model (`/src/lib/store.ts`, `/src/hooks/useTeam.ts`)
- Added `model` field to TeamRole interface
- Added `duties` field (string array)
- Added `spawnPrompt` optional field
- Added `emoji` optional field
- Updated API route to handle new fields

### 3. Projects List (`/src/app/projects/page.tsx`)
- Changed navigation from `/workspace?project={id}` to `/projects/{id}`
- Direct navigation to project detail page (no double click)

### 4. Project Detail Page (`/src/app/projects/[id]/page.tsx`)
- Added "Team Roles" tab to project detail
- Shows assigned roles with model/thinking info
- Shows available roles that can be assigned
- Add/remove role functionality
- Uses `useProjectRoles` hook

### 5. Project Roles API (`/src/app/api/projects/[id]/roles/route.ts`)
- New API route for managing project role assignments
- GET: List assigned and available roles
- POST: Assign role to project
- DELETE: Remove role from project
- Stores role IDs in PROJECT.json

### 6. Project Roles Hook (`/src/hooks/useProjectRoles.ts`)
- New hook for managing project roles
- `assignedRoles`, `availableRoles`, `assignedRoleIds`
- `assignRole()`, `removeRole()` functions

### 7. Task Form (`/src/components/TaskForm.tsx`)
- Updated to fetch roles from `/api/projects/{id}/roles`
- Only shows roles assigned to the project
- Shows warning message if no roles assigned
- `allowedRoleIds` prop for filtering

### 8. Agent Detail Page (`/src/app/agents/[id]/page.tsx`)
- Removed "Spawn Sub-agent" button
- Removed spawn modal
- Added info banner directing users to Projects
- Updated styling to match design system
- Shows info and sessions only

### 9. Team API Route Fixes (`/src/app/api/team/route.ts`)
- Fixed to include all required TeamRole fields
- Proper handling of model, duties, spawnPrompt, emoji fields

### 10. UseTeam Hook Fixes (`/src/hooks/useTeam.ts`)
- Fixed API endpoints to match `/api/team` (not `/api/team/roles`)

## Correct Flow Implementation

```
1. TEAM (Define Roles)
   └── Create roles: Coder, Researcher, Designer, etc.
   └── Each role has: model, thinking, duties, spawnPrompt
   └── Route: /team

2. PROJECTS (Work Units)
   └── Create project
   └── Assign which ROLES can work on this project (Team Roles tab)
   └── Create TASKS within project
   └── Route: /projects/[id]

3. TASKS (Actual Work)
   └── Create task in project
   └── Select ROLE from assigned project roles
   └── Task spawns sub-agent with that role's config
   └── Track status: pending → processing → completed
   └── Route: /projects/[id] (Tasks tab)
```

## Acceptance Criteria Status

- [x] Sidebar has: Dashboard, Team, Projects, Sessions, Logs, Settings
- [x] Team page lists roles with model/thinking config
- [x] Project has "Team Roles" tab to assign roles
- [x] Create task lets you select from assigned roles
- [x] Task spawns sub-agent with correct role config
- [x] No confusing double navigation
- [x] Flow: Team → Project → Task → Spawn
