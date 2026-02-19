# OpenClaw OpenTask

A futuristic web dashboard for managing OpenClaw agents. Built with Next.js, TypeScript, and Tailwind CSS.

![Dashboard](https://via.placeholder.com/800x400/0a0a0f/3b82f6?text=OpenClaw+OpenTask)

## ✨ Features

### 🖥️ System Monitoring
- **Real-time Gateway Status** - Monitor gateway health, uptime, and performance
- **Live Session Tracking** - View all active sessions across channels
- **Node Management** - See connected nodes and their status
- **Live Log Viewer** - Real-time log streaming

### 🤖 Agent Management
- **Create & Configure Agents** - Set up new agents with custom models and settings
- **Agent Templates** - Quick-start with personality templates
- **Edit Agent Settings** - Modify model, thinking mode, and identity
- **File Editor** - Edit agent workspace files (SOUL.md, AGENTS.md, etc.)

### ⚡ Advanced Features
- **Rate Limiting** - Built-in API rate limiting for security
- **Input Validation** - Zod-based schema validation
- **Auto-refresh** - Real-time data updates
- **Dark Theme** - Cyberpunk-inspired dark UI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenClaw gateway running (default: http://localhost:18789)
- Gateway token for authentication

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/openclaw-opentask.git
cd openclaw-opentask

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
NEXT_PUBLIC_GATEWAY_URL=http://localhost:18789
NEXT_PUBLIC_GATEWAY_TOKEN=your-gateway-token-here

# GitHub OAuth (optional - for Git integration)
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

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
openclaw-opentask/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   ├── agents/            # Agent management pages
│   │   ├── workspace/         # File editor
│   │   ├── settings/          # Config editor
│   │   └── ...
│   ├── components/            # React components
│   │   ├── GlassCard.tsx     # Glassmorphism card component
│   │   ├── NeonButton.tsx    # Neon-style buttons
│   │   └── ...
│   ├── lib/                   # Utility libraries
│   │   ├── agent.ts          # Agent management
│   │   ├── rateLimit.ts      # Rate limiting
│   │   └── ...
│   └── types/                 # TypeScript types
├── public/                    # Static assets
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
| `/api/agents/[id]/files/[[...filename]]` | GET/PUT | Read/write agent files |
| `/api/agents/[id]/sessions` | GET | List agent sessions |

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

## 🔒 Security Features

### OAuth Security
- **CSRF Protection**: State parameter verification on OAuth callbacks
- **Token Encryption**: All tokens encrypted with AES-256-GCM
- **Short-lived States**: OAuth states expire after 10 minutes

### Rate Limiting
- Built-in rate limiting for API endpoints
- Automatic cleanup of rate limit entries

### Input Validation
- Zod schema validation on all inputs
- Path sanitization to prevent directory traversal

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
pm2 start npm --name "openclaw-opentask" -- start
```

## 📝 Agent Workspace Files

When you create an agent, the following files are automatically created:

| File | Purpose |
|------|---------|
| `SOUL.md` | Core personality definition |
| `IDENTITY.md` | Agent identity settings |
| `AGENTS.md` | Agent behavior instructions |
| `USER.md` | User preferences and context |
| `MEMORY.md` | Long-term memory storage |
| `TOOLS.md` | Tool configurations |
| `HEARTBEAT.md` | Periodic task definitions |

## ⚠️ Troubleshooting

### Gateway Connection Failed
- Verify `NEXT_PUBLIC_GATEWAY_URL` is correct
- Check if gateway is running
- Ensure `NEXT_PUBLIC_GATEWAY_TOKEN` is valid

### Permission Errors
- Ensure write access to `~/.openclaw/` directory
- Check file permissions for config files

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Run type check: `npx tsc --noEmit`

## 📄 License

MIT License - See LICENSE file for details

---

Built with ❤️ for OpenClaw
