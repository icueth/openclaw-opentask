# OpenClaw Dashboard (OpenTask)

A clean, focused dashboard for managing OpenClaw agents and tasks. Built with Next.js 14, TypeScript, and Tailwind CSS.

## ✨ Features

### 🗂️ Project Management
- **Create Projects** with isolated workspaces in `data/projects/`
- **GitHub Integration** - Clone repositories directly when creating projects
- **Project Memory** - Each project has MEMORY.md for persistent context
- **Project Documentation** - Auto-generated PROJECT.md templates

### 📋 Task Management
- **Create Tasks** with title, description, and priority
- **Auto-Execution** via TaskMan agent - tasks start automatically
- **Multi-Agent Tasks** - Select 1-5 agents with thinking levels 1-5
- **Real-time Status** - Track task progress from pending → processing → completed
- **Live Log Streaming** - View agent output in real-time

### 🤖 Agent Management
- **View Agents** - List all configured OpenClaw agents
- **Create Agents** - Set up new agents with templates
- **Edit Agents** - Modify agent settings (model, thinking, skills)
- **Agent Files** - Manage AGENTS.md, SOUL.md, TEAM.md per agent

### 🔧 Git Integration
- **Pull Git** - Create tasks to pull latest code from repositories
- **Commit/Push** - Git operations through the dashboard UI
- **GitHub OAuth** - Secure authentication for GitHub operations
- **Repository Cloning** - Clone repos when creating projects

### ⚙️ Settings & Configuration
- **Git Authentication** - Configure GitHub OAuth or PAT
- **System Settings** - Gateway connection, preferences
- **Workspace Editor** - Edit OpenClaw configuration files

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenClaw gateway running (default: http://localhost:18789)
- Gateway token for authentication

### Installation

```bash
# Navigate to the dashboard directory
cd /Users/icue/.openclaw/workspace-coder/dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your GATEWAY_TOKEN
```

### Configuration

Create `.env.local`:

```env
# Required
GATEWAY_URL=http://localhost:18789
GATEWAY_TOKEN=your-gateway-token-here

# Optional
PORT=3456
```

### Running

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start
```

The dashboard will be available at `http://localhost:3000` (dev) or `http://localhost:3456` (production).

## 📁 Project Structure

```
dashboard/
├── data/                      # Dashboard data (projects, tasks, logs)
│   ├── projects/             # Project workspaces
│   │   └── {project-id}/
│   │       ├── PROJECT.json
│   │       ├── PROJECT.md
│   │       ├── MEMORY.md
│   │       └── ...
│   ├── projects.json         # Project registry
│   ├── tasks.json            # Task registry
│   └── task-logs/            # Task execution logs
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API endpoints
│   │   ├── agents/          # Agent management pages
│   │   ├── projects/        # Project management pages
│   │   ├── settings/        # Settings pages
│   │   └── page.tsx         # Dashboard home
│   ├── components/          # React components
│   │   ├── GlassCard.tsx   # Glassmorphism UI component
│   │   ├── TaskBoard.tsx   # Task kanban board
│   │   └── ...
│   └── lib/                 # Utility libraries
│       ├── store.ts        # Data persistence
│       ├── taskQueue.ts    # Task queue management
│       ├── taskRunner.ts   # Task execution via TaskMan
│       └── memory.ts       # Project memory management
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind configuration
└── package.json            # Dependencies
```

## 🔌 API Endpoints

### Projects
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List all projects |
| `/api/projects` | POST | Create new project |
| `/api/projects/[id]` | GET | Get project details |
| `/api/projects/[id]` | PUT | Update project |
| `/api/projects/[id]` | DELETE | Delete project |
| `/api/projects/[id]/tasks` | GET | List project tasks |
| `/api/projects/[id]/tasks` | POST | Create new task |

### Tasks
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List all tasks |
| `/api/tasks?projectId=x` | GET | Filter by project |
| `/api/tasks?status=x` | GET | Filter by status |

### Agents
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List all agents |
| `/api/agents` | POST | Create new agent |
| `/api/agents/[id]` | GET | Get agent details |
| `/api/agents/[id]` | PUT | Update agent |
| `/api/agents/[id]` | DELETE | Delete agent |

### System
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Gateway status |
| `/api/config` | GET/PUT | Config management |
| `/api/logs` | GET | Read logs |
| `/api/sessions` | GET | List sessions |
| `/api/nodes` | GET | List nodes |

### Settings
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings/git-auth` | GET | Get Git auth status |
| `/api/settings/git-auth` | POST | Save credentials |
| `/api/settings/git-auth` | DELETE | Clear credentials |
| `/api/settings/git-auth/test` | POST | Test connection |

## 🔄 Task Execution Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Dashboard │────▶│   TaskMan    │────▶│   Worker    │
│   (Next.js) │     │   (Agent)    │     │  (Subagent) │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                    │
       │                    │                    ▼
       │                    │             Creates files
       │                    │                    │
       │                    ▼                    │
       │             Spawns via           ┌─────────────┐
       │             sessions_spawn       │   Project   │
       │                                  │   Files     │
       │                                  └─────────────┘
       │                                          │
       │                    ┌─────────────────────┘
       │                    │
       ▼                    ▼
┌─────────────────────────────────────────┐
│     Status Detector (Every 10s)         │
│  - Checks task log files                │
│  - Updates task status                  │
└─────────────────────────────────────────┘
```

### How Tasks Work

1. **Create Task** - User creates task via UI/API
2. **Auto-Start** - Task immediately goes to `processing` status
3. **TaskMan Spawn** - TaskMan agent is called via `openclaw agent --agent taskman`
4. **Worker Spawn** - TaskMan spawns worker sub-agent(s) via `sessions_spawn`
5. **Log Streaming** - Workers write logs to `data/task-logs/{taskId}.json`
6. **Status Detection** - Status detector checks logs every 10s
7. **Completion** - Task marked `completed` when worker finishes

### Multi-Agent Configuration

When creating a task, you can configure:
- **Agent Count**: 1-5 agents
- **Thinking Levels**: 1-5 per agent
  - Level 1: Quick responses
  - Level 2: Light reasoning
  - Level 3: Medium (default)
  - Level 4: Deep reasoning
  - Level 5: Maximum depth

## 🎨 Customization

### Colors
Edit `tailwind.config.js`:

```js
colors: {
  'neon-cyan': '#00f0ff',
  'neon-purple': '#b829f7',
  'neon-pink': '#ff0080',
  'neon-green': '#22c55e',
  'space-800': '#151520',
  'space-900': '#0a0a0f',
}
```

### Glass Card Variants
Available variants: `default`, `cyan`, `purple`, `pink`, `green`, `yellow`

## 🚢 Deployment

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DASHBOARD_DATA_DIR` | Path to data directory | `./data` |
| `PORT` | Server port | `3000` (dev), `3456` (prod) |
| `NODE_ENV` | Environment mode | `development` |

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3456
CMD ["npm", "start"]
```

### PM2

```bash
npm run build
pm2 start npm --name "openclaw-dashboard" -- start
```

## 📝 Data Storage

All data is stored in JSON files in the `data/` directory:

- `projects.json` - Project registry
- `tasks.json` - Task records
- `projects/{id}/` - Individual project workspaces
- `task-logs/{id}.json` - Task execution logs

This makes the system portable and easy to backup:

```bash
# Backup
zip -r dashboard-backup-$(date +%Y%m%d).zip data/

# Restore
unzip dashboard-backup-20240218.zip
```

## ⚠️ Troubleshooting

### Gateway Connection Failed
- Verify `GATEWAY_URL` is correct
- Check if gateway is running: `openclaw gateway status`
- Ensure `GATEWAY_TOKEN` is valid

### Tasks Not Starting
- Check TaskMan agent exists: `openclaw agent list`
- Verify `openclaw` CLI is in PATH
- Check task logs in `data/task-logs/`

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Run type check: `npx tsc --noEmit`

### Permission Errors
- Ensure write access to `data/` directory
- Check file permissions for config files

## 📄 License

MIT License - See LICENSE file for details

---

Built with ❤️ for OpenClaw

**by iCue** · [☕ Buy me a coffee](https://buy.stripe.com/14A28sbLa5mJ8SM5qY2VG01) · [🐙 GitHub](https://github.com/icue)
