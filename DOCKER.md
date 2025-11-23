# 🐳 Docker Deployment Guide

Complete guide for deploying FieldPro FSM using Docker and Docker Compose.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

---

## 🚀 Prerequisites

### Required Software

1. **Docker** 20.10+
   - [Install Docker](https://docs.docker.com/get-docker/)
   - Verify: `docker --version`

2. **Docker Compose** 2.0+
   - Included with Docker Desktop
   - Verify: `docker-compose --version` or `docker compose version`

### System Requirements

- **CPU:** 2+ cores
- **RAM:** 4GB minimum, 8GB recommended
- **Disk:** 10GB free space

---

## ⚡ Quick Start

### Option 1: Automated Script (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd fieldpro

# Run deployment script
./deploy.sh
```

The script will:
1. Check Docker installation
2. Create .env file from template
3. Build Docker images
4. Start all services
5. Display service URLs and useful commands

### Option 2: Manual Commands

```bash
# Clone the repository
git clone <repository-url>
cd fieldpro

# Create environment file
cp .env.docker .env

# Edit .env and update:
# - DB_PASSWORD
# - JWT_SECRET
# - Other credentials
nano .env

# Build and start services
docker-compose up -d

# Check status
docker-compose ps
```

---

## 🔧 Manual Setup

### Step 1: Environment Configuration

Create `.env` file from template:

```bash
cp .env.docker .env
```

**Required Configuration:**

```env
# Database - MUST CHANGE
DB_PASSWORD=your-secure-password-here

# JWT - MUST CHANGE (generate with: openssl rand -base64 32)
JWT_SECRET=your-long-random-secret-key-here

# Application URLs
FRONTEND_URL=http://localhost
BACKEND_PORT=3001
FRONTEND_PORT=80
```

**Optional Configuration:**

```env
# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# SMS
SMS_API_KEY=your-sms-api-key

# Integrations
QUICKBOOKS_CLIENT_ID=...
ZOHO_CLIENT_ID=...
GOOGLE_CLIENT_ID=...
```

### Step 2: Build Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Step 3: Start Services

```bash
# Start in detached mode
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d backend
```

### Step 4: Verify Deployment

```bash
# Check container status
docker-compose ps

# Check backend health
curl http://localhost:3001/health

# Check frontend health
curl http://localhost/health

# View logs
docker-compose logs
```

---

## ⚙️ Configuration

### Service Architecture

The Docker deployment consists of 3 services:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│  PostgreSQL │
│   (Nginx)   │     │  (Node.js)  │     │  (Database) │
│   Port 80   │     │  Port 3001  │     │  Port 5432  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Port Configuration

Default ports (can be changed in `.env`):

| Service | Internal Port | External Port | Environment Variable |
|---------|--------------|---------------|---------------------|
| Frontend | 80 | 80 | `FRONTEND_PORT` |
| Backend | 3001 | 3001 | `BACKEND_PORT` |
| PostgreSQL | 5432 | 5432 | `DB_PORT` |

### Volume Mounts

Data persistence is handled by Docker volumes:

- `postgres_data`: Database files
- `backend_uploads`: Uploaded files (documents, images)

### Network

All services communicate over `fieldpro-network` bridge network.

---

## 🎮 Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# Stop and remove volumes (DATA WILL BE LOST)
docker-compose down -v
```

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# Backend logs only
docker-compose logs -f backend

# Frontend logs only
docker-compose logs -f frontend

# PostgreSQL logs only
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100
```

### Shell Access

```bash
# Backend shell
docker-compose exec backend sh

# PostgreSQL shell
docker-compose exec postgres psql -U fieldpro

# Frontend shell
docker-compose exec frontend sh
```

### Database Management

```bash
# Backup database
docker-compose exec postgres pg_dump -U fieldpro fieldpro > backup.sql

# Restore database
docker-compose exec -T postgres psql -U fieldpro fieldpro < backup.sql

# Run migrations (if needed)
docker-compose exec backend node src/database/migrate.js
```

### Health Checks

```bash
# Check all service health
docker-compose ps

# Manual health check - Backend
curl http://localhost:3001/health

# Manual health check - Frontend
curl http://localhost/health

# Check container resource usage
docker stats
```

---

## 🔍 Troubleshooting

### Services Won't Start

```bash
# Check logs for errors
docker-compose logs

# Check specific service
docker-compose logs backend

# Rebuild images
docker-compose build --no-cache

# Clean start (removes volumes - DATA WILL BE LOST)
docker-compose down -v
docker-compose up -d
```

### Database Connection Errors

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify database credentials in .env
cat .env | grep DB_

# Test connection manually
docker-compose exec postgres psql -U fieldpro -c "SELECT 1;"
```

### Port Conflicts

If ports are already in use:

1. Change ports in `.env`:
```env
BACKEND_PORT=3002
FRONTEND_PORT=8080
DB_PORT=5433
```

2. Restart services:
```bash
docker-compose down
docker-compose up -d
```

### Frontend Can't Reach Backend

Check nginx proxy configuration:

```bash
# View nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Check backend health from frontend container
docker-compose exec frontend wget -O- http://backend:3001/health

# Check network connectivity
docker-compose exec frontend ping backend
```

### Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Remove unused images
docker image prune -a

# Remove unused volumes (CAREFUL - this removes data)
docker volume prune

# Remove all unused Docker resources
docker system prune -a
```

### Permission Issues

```bash
# Fix uploads directory permissions
docker-compose exec backend chown -R node:node /app/uploads

# Recreate backend container
docker-compose up -d --force-recreate backend
```

---

## 🏭 Production Deployment

### Production Checklist

Before deploying to production:

- [ ] Generate strong random `JWT_SECRET`
- [ ] Use complex `DB_PASSWORD`
- [ ] Configure email/SMS credentials
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up backup strategy
- [ ] Configure monitoring
- [ ] Review and update resource limits
- [ ] Enable log rotation
- [ ] Test disaster recovery

### SSL/TLS Setup

Use a reverse proxy like Nginx or Traefik with Let's Encrypt:

**Option 1: Traefik (Recommended)**

Add to `docker-compose.yml`:

```yaml
traefik:
  image: traefik:v2.10
  command:
    - "--providers.docker=true"
    - "--entrypoints.web.address=:80"
    - "--entrypoints.websecure.address=:443"
    - "--certificatesresolvers.letsencrypt.acme.email=your@email.com"
    - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - "/var/run/docker.sock:/var/run/docker.sock:ro"
    - "./letsencrypt:/letsencrypt"
```

**Option 2: External Nginx**

Use Nginx as reverse proxy with certbot for SSL.

### Resource Limits

Add resource limits to `docker-compose.yml`:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

### Monitoring

Recommended monitoring stack:

- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Loki**: Log aggregation
- **Cadvisor**: Container metrics

### Backup Strategy

Automated backup script:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup database
docker-compose exec -T postgres pg_dump -U fieldpro fieldpro | \
  gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup uploads
docker run --rm \
  -v fieldpro_backend_uploads:/source \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf /backup/uploads_$DATE.tar.gz -C /source .

# Keep last 30 days
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Set up cron job:

```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/fieldpro-backup.log 2>&1
```

### Environment-Specific Configs

Use different `.env` files:

```bash
# Development
cp .env.docker .env.dev

# Production
cp .env.docker .env.prod
# Edit .env.prod with production values

# Deploy with specific env
docker-compose --env-file .env.prod up -d
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)

---

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Review this troubleshooting guide
3. Check [GitHub Issues](https://github.com/your-repo/issues)
4. Contact support: support@yourcompany.com

---

**Version:** 1.0
**Last Updated:** November 2025
**Status:** Production Ready ✅
