# OpenClaw Dashboard - Setup Guide

Complete step-by-step installation and configuration guide.

## Prerequisites

### Required Software
- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **OpenClaw Gateway** running

### Verify Prerequisites

```bash
# Check Node.js version
node --version
# Should output: v18.x.x or higher

# Check npm version
npm --version
# Should output: 9.x.x or higher

# Check OpenClaw gateway
openclaw gateway status
# Should show: Gateway is running
```

## Installation

### Step 1: Navigate to Dashboard Directory

```bash
cd /Users/icue/.openclaw/workspace-coder/dashboard
```

### Step 2: Install Dependencies

```bash
npm install
```

Expected output:
```
added 145 packages, and audited 145 packages in 15s
```

### Step 3: Verify Installation

```bash
# Check if Next.js is installed
npx next --version
# Should output: 14.x.x
```

## Configuration

### Step 1: Create Environment File

```bash
cp .env.example .env.local
```

Or create `.env.local` manually:

```bash
touch .env.local
```

### Step 2: Get Gateway Token

Run this command to get your gateway token:

```bash
openclaw config get gateway.token
```

Or check your `~/.openclaw/openclaw.json` file for the token.

### Step 3: Edit Environment Variables

Open `.env.local`:

```bash
# Using VS Code
code .env.local

# Or any text editor
nano .env.local
```

Add the following:

```env
# Required: Gateway connection
GATEWAY_URL=http://localhost:18789
GATEWAY_TOKEN=your-actual-gateway-token-here

# Optional: Custom port for production
PORT=3456
```

## First Run

### Development Mode (Recommended for testing)

```bash
npm run dev
```

Expected output:
```
> openclaw-opentask@1.0.0 dev
> next dev

  ▲ Next.js 14.2.x
  - Local:        http://localhost:3000

  Ready in 2.5s
```

Open your browser to: **http://localhost:3000**

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm run start
```

Production server runs on: **http://localhost:3456**

### Verify Dashboard Works

1. You should see the dashboard loading
2. Gateway status shows "Connected" (green dot)
3. No red error banners appear
4. Sidebar navigation is visible

## Creating Your First Project

### Using the Dashboard UI

1. Navigate to **http://localhost:3000/projects**
2. Click the **"+ New Project"** button
3. Fill in the form:
   - **Project ID**: `my-first-project` (lowercase, no spaces)
   - **Name**: `My First Project`
   - **Description**: `Learning OpenClaw Dashboard`
4. Click **Create Project**

### Using the API

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-first-project",
    "name": "My First Project",
    "description": "Learning OpenClaw Dashboard"
  }'
```

### Verify Project Creation

The project should appear in:
- Dashboard project list
- File system at `data/projects/my-first-project/`

## Creating Your First Task

### Step 1: Navigate to Project

1. Go to **Projects** in the sidebar
2. Click on **My First Project**

### Step 2: Create a Task

1. Click **"New Task"** button
2. Fill in task details:
   - **Title**: `Hello World Task`
   - **Description**: `Create a simple hello world program`
   - **Priority**: `Medium`
   - **Agent Count**: 1 (or more for multi-agent)
   - **Thinking Level**: 3 (Medium)
3. Click **Create Task**

### Step 3: Monitor Task Execution

1. You'll be redirected to the task board
2. Watch the task move through statuses:
   - `pending` → `processing` → `completed`
3. Click on the task card to see details
4. View logs in the **Logs** section

### Step 4: View Results

After completion:
1. Task status shows `completed`
2. Click task to view:
   - Result/output
   - Execution logs
   - Any artifacts generated

## Multi-Agent Tasks

To use multiple agents on a task:

1. When creating a task, set **Agent Count** (1-5)
2. Each agent can have a different **Thinking Level**:
   - Level 1: Quick - Fast responses
   - Level 2: Light - Standard reasoning
   - Level 3: Medium - Balanced (default)
   - Level 4: Deep - Thorough analysis
   - Level 5: Maximum - Deep reasoning

The TaskMan agent will coordinate the multiple workers.

## GitHub Integration

### Clone Repository on Project Creation

1. When creating a project, enter a GitHub URL:
   - Example: `https://github.com/username/repo`
2. The repository will be cloned into the project workspace
3. PROJECT.md will be auto-populated with repo info

### Git Authentication

1. Go to **Settings** → **Git Authentication**
2. Choose authentication method:
   - **OAuth**: Click "Connect GitHub Account"
   - **PAT**: Enter Personal Access Token
3. Test connection

## Troubleshooting

### Dashboard Won't Start

**Problem**: `npm run dev` fails

**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Check for TypeScript errors
npx tsc --noEmit
```

### Gateway Connection Failed

**Problem**: Dashboard shows "Gateway Disconnected"

**Solutions**:
1. Verify gateway is running:
   ```bash
   openclaw gateway status
   ```

2. Check environment variables:
   ```bash
   cat .env.local
   ```

3. Test gateway directly:
   ```bash
   curl http://localhost:18789/api/status
   ```

### Tasks Not Executing

**Problem**: Tasks stay in "pending" status

**Solutions**:
1. Check TaskMan agent exists:
   ```bash
   openclaw agent list
   ```

2. Verify `openclaw` CLI is in PATH:
   ```bash
   which openclaw
   ```

3. Check task logs:
   ```bash
   ls data/task-logs/
   cat data/task-logs/{task-id}.json
   ```

### Can't Create Projects

**Problem**: Project creation fails

**Solutions**:
1. Check write permissions:
   ```bash
   ls -la data/
   ```

2. Verify disk space:
   ```bash
   df -h
   ```

3. Check for invalid project ID (lowercase, alphanumeric with hyphens)

### Port Already in Use

**Problem**: `Error: Port 3000 is already in use`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
npm run dev -- --port 3001
```

## Next Steps

Now that you have the dashboard running:

1. **Explore the UI** - Click around and get familiar with all sections
2. **Create More Projects** - Organize your work into projects
3. **Try Multi-Agent Tasks** - Use multiple agents for complex tasks
4. **Set Up Git** - Configure GitHub integration

## Getting Help

- **Documentation**: Check `README.md` for detailed API docs
- **Logs**: View logs in the dashboard or at `data/task-logs/`
- **Issues**: Check the GitHub issues page

---

**Happy Coding! 🚀**
