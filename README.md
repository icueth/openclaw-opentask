# OpenClaw Dashboard

A comprehensive, futuristic dashboard for monitoring and managing your OpenClaw instance. Built with Next.js, TypeScript, and Tailwind CSS.

![Dashboard](https://via.placeholder.com/800x400/0a0a0f/3b82f6?text=OpenClaw+Dashboard)

## ✨ Features

### 🖥️ System Monitoring
- **Real-time Gateway Status** - Monitor gateway health, uptime, and performance
- **Live Session Tracking** - View all active sessions across channels
- **Node Management** - See connected nodes and their status
- **Live Log Viewer** - Real-time log streaming with filters and search

### 🤖 Agent Management
- **Create & Configure Agents** - Set up new agents with custom models and settings
- **Agent Templates** - Quick-start templates (Programmer, Tester, Researcher, etc.)
- **Edit Agent Settings** - Modify model, thinking mode, skills, and identity
- **Team Management** - Configure team members for each agent

### 📁 Project & Task Management
- **Project Creation** - Create and manage projects with dedicated workspaces
- **Task Queue System** - Automated task assignment and execution
- **Role-Based Assignment** - Assign tasks to specific agent roles
- **Task Status Tracking** - Visual kanban board for task management
- **Project Memory** - Persistent memory per project

### 🛠️ Workspace Management
- **File Editor** - Edit AGENTS.md, SOUL.md, TEAM.md, USER.md, MEMORY.md
- **Config Editor** - View and modify openclaw.json
- **Auto-backup** - Automatic backups before changes
- **Protected Files** - Safety measures for critical files

### ⚡ Advanced Features
- **Rate Limiting** - Built-in API rate limiting for security
- **Input Validation** - Zod-based schema validation
- **Real-time Updates** - Auto-refresh for active tasks
- **Dark Theme** - Cyberpunk-inspired dark UI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenClaw gateway running (default: http://localhost:18789)
- Gateway token for authentication

### GitHub OAuth Setup (Optional)

To use OAuth authentication instead of Personal Access Tokens:

1. **Create a GitHub OAuth App:**
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Set **Application name**: "OpenClaw Dashboard" (or your preference)
   - Set **Homepage URL**: `http://localhost:3456`
   - Set **Authorization callback URL**: `http://localhost:3456/api/auth/github/callback`
   - Click "Register application"

2. **Copy credentials to .env.local:**
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

3. **Restart the dev server** to load the new environment variables

4. **Connect your account:**
   - Go to Settings → Git Authentication → OAuth
   - Click "Connect GitHub Account"
   - Authorize the app on GitHub
   - Done! Your account is now connected

### Installation

```bash
# Clone or navigate to the dashboard directory
cd /Users/icue/.openclaw/workspace-coder/dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings
```

### Configuration

Create `.env.local`:

```env
# Required
GATEWAY_URL=http://localhost:18789
GATEWAY_TOKEN=your-gateway-token-here

# GitHub OAuth (optional - for OAuth authentication)
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# Optional
NEXT_PUBLIC_APP_NAME=OpenClaw Dashboard
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
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   ├── agents/            # Agent management pages
│   │   ├── projects/          # Project management pages
│   │   ├── team/              # Team management pages
│   │   ├── workspace/         # File editor
│   │   ├── settings/          # Config editor
│   │   └── ...
│   ├── components/            # React components
│   │   ├── GlassCard.tsx     # Glassmorphism card component
│   │   ├── NeonButton.tsx    # Neon-style buttons
│   │   ├── TaskBoard.tsx     # Kanban task board
│   │   └── ...
│   ├── lib/                   # Utility libraries
│   │   ├── rateLimit.ts      # Rate limiting
│   │   ├── store.ts          # Data store
│   │   ├── taskQueue.ts      # Task queue system
│   │   └── taskRunner.ts     # Task execution
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── scripts/                   # Utility scripts
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind configuration
└── package.json              # Dependencies
```

## 🔌 API Endpoints

### Agents
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List all agents |
| `/api/agents` | POST | Create new agent |
| `/api/agents/[id]` | GET | Get agent details |
| `/api/agents/[id]` | PUT | Update agent |
| `/api/agents/[id]` | DELETE | Delete agent |
| `/api/agents/[id]/team` | GET | Get agent team |
| `/api/agents/[id]/team` | PUT | Update agent team |

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
| `/api/projects/[id]/tasks/[taskId]/start` | POST | Start task |
| `/api/projects/[id]/tasks/[taskId]/cancel` | POST | Cancel task |

### Team & Spawning
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/team/roles` | GET | List team roles |
| `/api/team/roles` | POST | Create role |
| `/api/team/spawn` | POST | Spawn team member |
| `/api/team/spawn` | GET | List spawn records |

### System
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Gateway status |
| `/api/config` | GET/PUT/PATCH | Config management |
| `/api/logs` | GET | Read logs |
| `/api/sessions` | GET | List sessions |
| `/api/nodes` | GET | List nodes |

### GitHub OAuth
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/github` | GET | Check OAuth configuration |
| `/api/auth/github` | POST | Initiate OAuth flow |
| `/api/auth/github/callback` | GET | Handle OAuth callback |

### Settings
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings/git-auth` | GET | Get Git auth status |
| `/api/settings/git-auth` | POST | Save credentials |
| `/api/settings/git-auth` | DELETE | Clear credentials |
| `/api/settings/git-auth/test` | POST | Test connection |

### Cron
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cron/process-tasks` | POST | Process task queue |
| `/api/cron/process-tasks` | GET | Get queue status |
| `/api/cron/process-tasks` | PUT | Update queue config |

## 🔒 Security Features

### OAuth Security
- **CSRF Protection**: State parameter verification on OAuth callbacks
- **Token Encryption**: All tokens encrypted with AES-256-GCM
- **Short-lived States**: OAuth states expire after 10 minutes
- **Secure Storage**: Credentials stored in macOS Keychain (or encrypted file fallback)

### Rate Limiting
- Spawn endpoint: 5 requests per minute
- GET requests: 30 requests per minute
- Automatic cleanup of rate limit entries

### Input Validation
- Zod schema validation on all inputs
- Path sanitization to prevent directory traversal
- String length limits on all text inputs
- Alphanumeric validation for IDs

### File Path Security
- All file paths sanitized with `path.basename()`
- Restricted to workspace directory
- Protected files cannot be deleted

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

### Vercel

```bash
npm i -g vercel
vercel
```

## 📝 Workspace Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Agent behavior instructions |
| `SOUL.md` | Core personality definition |
| `TEAM.md` | Team member profiles and spawn prompts |
| `USER.md` | User preferences and context |
| `MEMORY.md` | Long-term memory storage |
| `TOOLS.md` | Tool configurations |
| `IDENTITY.md` | Agent identity settings |
| `HEARTBEAT.md` | Periodic task definitions |

## ⚠️ Troubleshooting

### Gateway Connection Failed
- Verify `GATEWAY_URL` is correct
- Check if gateway is running
- Ensure `GATEWAY_TOKEN` is valid

### Permission Errors
- Ensure write access to workspace directory
- Check file permissions for config files

### Rate Limit Errors
- Wait for rate limit window to reset
- Check rate limit headers in response

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Run type check: `npx tsc --noEmit`

## 🗺️ Roadmap

- [ ] WebSocket support for real-time updates
- [ ] Multi-gateway support
- [ ] Advanced analytics and metrics
- [ ] Custom dashboard widgets
- [ ] Agent performance analytics
- [ ] Batch operations
- [ ] Export/import functionality
- [ ] Mobile app companion

## 📄 License

MIT License - See LICENSE file for details

---

Built with ❤️ for OpenClaw

**Ready for Cody to use in the morning!** 🚀