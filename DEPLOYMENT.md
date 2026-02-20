# Dashboard Deployment Guide

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DASHBOARD_DATA_DIR` | Path to data directory (projects, tasks, logs) | `./data` |
| `PORT` | Server port | `3000` (dev), `3456` (prod) |
| `NODE_ENV` | Environment mode | `development` |
| `GATEWAY_URL` | OpenClaw gateway URL | `http://localhost:18789` |
| `GATEWAY_TOKEN` | Gateway authentication token | (required) |

## Deployment Options

### Option 1: Copy Data Directory (Single Machine)

Copy entire `data/` folder to new machine:
```bash
rsync -avz data/ user@new-machine:/path/to/dashboard/data/
```

### Option 2: External Data Directory (Multi-instance)

Set environment variable to use external data location:

```bash
# Linux/Mac
export DASHBOARD_DATA_DIR=/var/lib/openclaw-dashboard/data

# Or in .env file
echo "DASHBOARD_DATA_DIR=/var/lib/openclaw-dashboard/data" > .env.local

# Start server
npm run build
npm start
```

### Option 3: Docker

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

```yaml
# docker-compose.yml
version: '3.8'
services:
  dashboard:
    build: .
    ports:
      - "3456:3456"
    volumes:
      - dashboard-data:/app/data
    environment:
      - DASHBOARD_DATA_DIR=/app/data
      - GATEWAY_URL=http://host.docker.internal:18789
      - GATEWAY_TOKEN=${GATEWAY_TOKEN}

volumes:
  dashboard-data:
```

## Data Structure

```
data/
├── projects.json          # Project definitions
├── tasks.json             # Task records
├── spawns.json            # Spawn records (legacy)
├── task-logs/             # Task execution logs
│   └── {task-id}.json    # Individual task logs
└── projects/              # Project workspaces
    └── {project-id}/
        ├── PROJECT.json
        ├── PROJECT.md
        ├── MEMORY.md
        └── ...
```

## Backup & Restore

```bash
# Backup
zip -r dashboard-backup-$(date +%Y%m%d).zip data/

# Restore
unzip dashboard-backup-20240218.zip
```

## Troubleshooting

### "Project not found" after deployment

1. Check if `DASHBOARD_DATA_DIR` is set correctly
2. Verify data files exist in that directory:
   ```bash
   ls -la $DASHBOARD_DATA_DIR
   ```
3. Ensure directory is readable/writable

### Data persistence issues

Make sure the data directory:
- Is on a persistent volume (not ephemeral)
- Has correct permissions (readable/writable by node process)
- Is not in a tmpfs or RAM disk (unless intended)

### Gateway connection issues in Docker

When running in Docker, the dashboard needs to reach the gateway:

```bash
# Use host.docker.internal to reach host from container
GATEWAY_URL=http://host.docker.internal:18789

# Or use the host IP
GATEWAY_URL=http://192.168.1.x:18789
```

## Multi-Machine Sync

For syncing between multiple machines, consider:
- NFS mount for shared data
- Database backend (PostgreSQL, MongoDB) instead of JSON files
- Object storage (S3, MinIO) for file storage
- Git-based sync for project files

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `PORT` if needed
- [ ] Set `DASHBOARD_DATA_DIR` for persistent storage
- [ ] Set `GATEWAY_TOKEN` for authentication
- [ ] Ensure data directory is backed up
- [ ] Configure firewall rules
- [ ] Set up log rotation
