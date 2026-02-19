# OpenClaw Dashboard - Setup Guide

Complete step-by-step installation and configuration guide for the OpenClaw Dashboard.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [First Run](#first-run)
5. [Creating Your First Project](#creating-your-first-project)
6. [Creating Your First Task](#creating-your-first-task)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **OpenClaw Gateway** running ([Installation Guide](https://docs.openclaw.io))

### System Requirements
- macOS, Linux, or Windows (WSL2 recommended)
- 2GB RAM minimum (4GB recommended)
- 1GB free disk space

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

---

## Installation

### Step 1: Navigate to Dashboard Directory

```bash
cd /Users/icue/.openclaw/workspace-coder/dashboard
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Zod (validation)
- Recharts (charts)
- Lucide React (icons)

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

---

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

Open `.env.local` in your favorite editor:

```bash
# Using VS Code
code .env.local

# Using nano
nano .env.local

# Using vim
vim .env.local
```

Add the following:

```env
# Required: Gateway connection
GATEWAY_URL=http://localhost:18789
GATEWAY_TOKEN=your-actual-gateway-token-here

# Optional: App customization
NEXT_PUBLIC_APP_NAME=OpenClaw Dashboard

# Optional: Custom port for production
PORT=3456
```

### Step 4: Save and Verify

Save the file and verify it's readable:

```bash
cat .env.local
```

---

## First Run

### Development Mode (Recommended for testing)

```bash
npm run dev
```

Expected output:
```
> openclaw-dashboard@1.0.0 dev
> next dev

  ▲ Next.js 14.2.x
  - Local:        http://localhost:3000
  - Environments: .env.local

  Ready in 2.5s
```

Open your browser to: **http://localhost:3000**

### Verify Dashboard Works

1. You should see the dashboard loading screen
2. After a few seconds, the main dashboard appears
3. Check that:
   - Gateway status shows "Connected" (green dot)
   - No red error banners appear
   - Sidebar navigation is visible

### Production Mode (For deployment)

```bash
# Build the application
npm run build

# Start production server
npm run start
```

Production server runs on: **http://localhost:3456**

---

## Configuring OpenClaw Gateway

### Ensure Gateway is Running

```bash
openclaw gateway status
```

If not running:

```bash
openclaw gateway start
```

### Verify API Access

Test the gateway API:

```bash
curl http://localhost:18789/api/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return JSON with gateway status.

### Enable Required Features

Edit `~/.openclaw/openclaw.json`:

```json
{
  "gateway": {
    "enabled": true,
    "port": 18789,
    "token": "your-token"
  },
  "agents": {
    "enabled": true,
    "defaults": {
      "model": {
        "primary": "kimi-coding/k2p5"
      }
    }
  }
}
```

Restart gateway after changes:

```bash
openclaw gateway restart
```

---

## Creating Your First Project

### Method 1: Using the Dashboard UI

1. Navigate to **http://localhost:3000/projects**
2. Click the **"+ New Project"** button
3. Fill in the form:
   - **Project ID**: `my-first-project` (lowercase, no spaces)
   - **Name**: `My First Project`
   - **Description**: `Learning OpenClaw Dashboard`
4. Click **Create Project**

### Method 2: Using the API

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
- File system at `~/.openclaw/workspace/projects/my-first-project/`

---

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
   - **Role**: Select an available role (or leave blank for auto-assign)
3. Check **"Auto-start task after creation"**
4. Click **Create Task**

### Step 3: Monitor Task Execution

1. You'll be redirected to the task board
2. Watch the task move through statuses:
   - `created` → `pending` → `active` → `processing` → `completed`
3. Click on the task card to see details
4. View logs in the **Logs** section

### Step 4: View Results

After completion:
1. Task status shows `completed`
2. Click task to view:
   - Result/output
   - Any artifacts generated
   - Execution logs

---

## Creating Team Roles

### Why Create Roles?

Roles define specialized agents that can be spawned for specific tasks:
- **Coder**: For programming tasks
- **Researcher**: For research and analysis
- **Reviewer**: For code review
- **Designer**: For UI/UX tasks

### Create a Role

1. Go to **Team** → **Manage Roles**
2. Click **"New Role"**
3. Fill in:
   - **Role ID**: `coder` (lowercase, no spaces)
   - **Name**: `Software Developer`
   - **Description**: `Expert in writing clean, efficient code`
   - **Thinking Mode**: `high` (for complex reasoning)
   - **System Prompt**: Detailed instructions for this role
4. Click **Create Role**

### Example System Prompt

```markdown
You are an expert software developer specializing in:
- Clean, maintainable code
- Best practices and design patterns
- Comprehensive documentation
- Unit testing

Always:
1. Write code with clear comments
2. Follow language conventions
3. Include error handling
4. Provide usage examples
```

---

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

4. Check firewall/network settings

### Can't Create Projects

**Problem**: Project creation fails

**Solutions**:
1. Check write permissions:
   ```bash
   ls -la ~/.openclaw/workspace/projects/
   ```

2. Verify disk space:
   ```bash
   df -h
   ```

3. Check for invalid project ID (must be lowercase, alphanumeric with hyphens)

### Tasks Not Executing

**Problem**: Tasks stay in "pending" or "created" status

**Solutions**:
1. Check task queue processor is running:
   ```bash
   curl http://localhost:3000/api/cron/process-tasks
   ```

2. Manually trigger processing:
   ```bash
   curl -X POST http://localhost:3000/api/cron/process-tasks
   ```

3. Check role exists:
   ```bash
   curl http://localhost:3000/api/team/roles
   ```

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

---

## Next Steps

Now that you have the dashboard running:

1. **Explore the UI** - Click around and get familiar with all sections
2. **Create More Projects** - Organize your work into projects
3. **Set Up Team Roles** - Define specialized agents for different tasks
4. **Try Spawning** - Use the team spawn feature to create sub-agents
5. **Customize** - Edit workspace files (AGENTS.md, SOUL.md, etc.)

## Getting Help

- **Documentation**: Check `README.md` for detailed API docs
- **Logs**: View logs in the dashboard or at `~/.openclaw/logs/`
- **Issues**: Check the GitHub issues page
- **Community**: Join the OpenClaw Discord

---

**Happy Coding! 🚀**