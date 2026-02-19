# Dashboard Deployment Guide

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DASHBOARD_DATA_DIR` | Path to data directory (projects, tasks, spawns) | `./data` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

## Deployment Options

### Option 1: Copy Data Directory (Recommended for single machine)

Copy entire `data/` folder to new machine:
```bash
rsync -avz data/ user@new-machine:/path/to/dashboard/data/
```

### Option 2: External Data Directory (Recommended for multi-instance)

Set environment variable to use external data location:

```bash
# Linux/Mac
export DASHBOARD_DATA_DIR=/var/lib/openclaw-dashboard/data

# Or in .env file
echo "DASHBOARD_DATA_DIR=/var/lib/openclaw-dashboard/data" > .env.local

# Start server
npm run start
```

### Option 3: Docker Volume

```yaml
# docker-compose.yml
version: '3.8'
services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - dashboard-data:/app/data
    environment:
      - DASHBOARD_DATA_DIR=/app/data

volumes:
  dashboard-data:
```

## Data Structure

```
data/
├── projects.json      # Project definitions
├── tasks.json         # Task records
├── spawns.json        # Spawn records
├── task-contexts/     # Task execution contexts
└── task-instructions/ # Generated task prompts
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

## Multi-Machine Sync

For syncing between multiple machines, consider:
- NFS mount for shared data
- Database backend (PostgreSQL, MongoDB) instead of JSON files
- Object storage (S3, MinIO) for file storage
- Git-based sync for project files