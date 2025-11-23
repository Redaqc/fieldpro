# FieldPro FSM - Production Deployment Guide

## 🚀 Overview

This guide covers deploying FieldPro FSM to production using Docker. The application consists of three services:
- **Frontend**: React + Vite (served by Nginx)
- **Backend**: Node.js + Express API
- **Database**: PostgreSQL 15+

---

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: 4GB minimum (8GB recommended)
- **CPU**: 2 cores minimum (4 cores recommended)
- **Storage**: 20GB minimum (SSD recommended)
- **Network**: Public IP address and domain name

### Software Requirements
- Docker 24.0+
- Docker Compose 2.0+
- Git
- OpenSSL (for generating secrets)

---

## 🔧 Step 1: Server Setup

### 1.1 Install Docker & Docker Compose

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (logout/login required)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 1.2 Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 1.3 Create Application Directory

```bash
# Create deployment directory
sudo mkdir -p /opt/fieldpro
sudo chown $USER:$USER /opt/fieldpro
cd /opt/fieldpro
```

---

## 📦 Step 2: Deploy Application

### 2.1 Clone Repository

```bash
cd /opt/fieldpro
git clone https://github.com/your-org/fieldpro.git .
```

### 2.2 Configure Environment

```bash
# Copy production environment template
cp .env.production .env

# Generate strong JWT secret
openssl rand -base64 64

# Generate strong database password
openssl rand -base64 32

# Edit .env with your production values
nano .env
```

**Required Environment Variables:**
```bash
# Database (REQUIRED)
DB_PASSWORD=<generated-password>

# JWT (REQUIRED)
JWT_SECRET=<generated-secret>

# Frontend URL (REQUIRED)
FRONTEND_URL=https://your-domain.com

# Email (RECOMMENDED)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<app-password>
EMAIL_FROM=FieldPro FSM <noreply@your-domain.com>
```

### 2.3 Configure Integration Credentials

Edit `.env` and add your integration API credentials:

**QuickBooks:**
1. Go to https://developer.intuit.com/
2. Create new app → Get credentials
3. Add to `.env`:
   ```bash
   QUICKBOOKS_CLIENT_ID=<your-client-id>
   QUICKBOOKS_CLIENT_SECRET=<your-client-secret>
   QUICKBOOKS_REDIRECT_URI=https://your-domain.com/api/integrations/quickbooks/callback
   QUICKBOOKS_ENVIRONMENT=production
   ```

**Zoho Books:**
1. Go to https://api-console.zoho.com/
2. Create server-based application
3. Add to `.env`:
   ```bash
   ZOHO_CLIENT_ID=<your-client-id>
   ZOHO_CLIENT_SECRET=<your-client-secret>
   ZOHO_REDIRECT_URI=https://your-domain.com/api/integrations/zoho/callback
   ```

**Google Calendar:**
1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 credentials
3. Add to `.env`:
   ```bash
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   GOOGLE_REDIRECT_URI=https://your-domain.com/api/integrations/google/callback
   ```

**Stripe Payment:**
1. Go to https://dashboard.stripe.com/
2. Get LIVE API keys (not test keys!)
3. Add to `.env`:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

**Twilio SMS:**
1. Go to https://www.twilio.com/console
2. Get Account SID and Auth Token
3. Add to `.env`:
   ```bash
   TWILIO_ACCOUNT_SID=<your-sid>
   TWILIO_AUTH_TOKEN=<your-token>
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### 2.4 Build and Start Services

```bash
# Build Docker images
docker compose build

# Start services in detached mode
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f
```

### 2.5 Verify Deployment

```bash
# Check backend health
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":...}

# Check frontend
curl http://localhost

# Check database connection
docker compose exec backend node -e "require('./src/database/pool.js').query('SELECT NOW()')"
```

---

## 🔒 Step 3: SSL/HTTPS Setup

### Option A: Using Cloudflare (Recommended)

1. **Add domain to Cloudflare:**
   - Sign up at https://cloudflare.com
   - Add your domain
   - Update nameservers at your registrar

2. **Configure DNS:**
   ```
   Type: A
   Name: @
   Content: <your-server-ip>
   Proxy: ON (orange cloud)

   Type: CNAME
   Name: www
   Content: your-domain.com
   Proxy: ON (orange cloud)
   ```

3. **SSL Settings:**
   - SSL/TLS → Overview → Full
   - Edge Certificates → Always Use HTTPS: ON
   - Edge Certificates → Automatic HTTPS Rewrites: ON

### Option B: Using Let's Encrypt + Nginx

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Stop frontend container
docker compose stop frontend

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Start frontend container
docker compose start frontend

# Configure auto-renewal
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

---

## 📊 Step 4: Monitoring & Logging

### 4.1 Set Up Log Rotation

```bash
# Create log directory
sudo mkdir -p /var/log/fieldpro

# Configure Docker logging
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker
```

### 4.2 Set Up Health Monitoring

```bash
# Create monitoring script
cat > /opt/fieldpro/monitor.sh <<'EOF'
#!/bin/bash
if ! curl -f http://localhost:3001/health > /dev/null 2>&1; then
  echo "Backend unhealthy - restarting..."
  cd /opt/fieldpro && docker compose restart backend
fi
EOF

chmod +x /opt/fieldpro/monitor.sh

# Add to crontab (check every 5 minutes)
crontab -e
# Add: */5 * * * * /opt/fieldpro/monitor.sh
```

### 4.3 Configure External Monitoring (Optional)

**Sentry Error Tracking:**
```bash
# Add to .env
SENTRY_DSN=https://...@sentry.io/...
LOG_SERVICE=sentry
```

**Datadog Monitoring:**
```bash
# Add to .env
DATADOG_API_KEY=<your-api-key>
LOG_SERVICE=datadog
```

---

## 💾 Step 5: Database Backups

### 5.1 Create Backup Script

```bash
# Create backup directory
sudo mkdir -p /var/backups/fieldpro
sudo chown $USER:$USER /var/backups/fieldpro

# Create backup script
cat > /opt/fieldpro/backup.sh <<'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/fieldpro"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fieldpro_$TIMESTAMP.sql.gz"

# Get database credentials from .env
source /opt/fieldpro/.env

# Create backup
docker compose exec -T postgres pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x /opt/fieldpro/backup.sh
```

### 5.2 Schedule Automated Backups

```bash
# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/fieldpro/backup.sh >> /var/log/fieldpro/backup.log 2>&1
```

### 5.3 Configure S3 Backups (Optional)

```bash
# Install AWS CLI
sudo apt install awscli -y

# Configure AWS credentials
aws configure

# Update backup script to upload to S3
cat >> /opt/fieldpro/backup.sh <<'EOF'

# Upload to S3
aws s3 cp $BACKUP_FILE s3://fieldpro-backups/$(basename $BACKUP_FILE)

echo "Backup uploaded to S3"
EOF
```

### 5.4 Test Backup Restore

```bash
# Test restore from backup
cd /opt/fieldpro

# Stop services
docker compose down

# Restore from backup
gunzip < /var/backups/fieldpro/fieldpro_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T postgres psql -U fieldpro fieldpro

# Start services
docker compose up -d
```

---

## 🧪 Step 6: Testing

### 6.1 Run Backend Tests

```bash
cd /opt/fieldpro/server
npm test
```

### 6.2 Test API Endpoints

```bash
# Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "technician"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get customers (requires token from login)
curl http://localhost:3001/api/customers \
  -H "Authorization: Bearer <token>"
```

### 6.3 Test Integrations

Access the following URLs in your browser (after login):
- QuickBooks: `https://your-domain.com/integrations/quickbooks`
- Zoho: `https://your-domain.com/integrations/zoho`
- Google Calendar: `https://your-domain.com/integrations/google`

---

## 🚦 Step 7: Go Live Checklist

Before making your application publicly available:

- [ ] All `.env` variables configured
- [ ] Strong passwords generated (20+ characters)
- [ ] JWT_SECRET is secure (64+ characters)
- [ ] SSL/HTTPS enabled and working
- [ ] Database backups configured and tested
- [ ] Monitoring and alerting set up
- [ ] Health checks passing
- [ ] Integration credentials verified
- [ ] Email sending working
- [ ] SMS sending working (if enabled)
- [ ] Payment processing tested (if enabled)
- [ ] Firewall rules configured
- [ ] Log rotation enabled
- [ ] Domain DNS configured
- [ ] Rate limiting enabled
- [ ] CORS origins configured correctly

---

## 🔄 Updating the Application

### Pull Latest Changes

```bash
cd /opt/fieldpro

# Pull latest code
git pull origin main

# Rebuild and restart services
docker compose build
docker compose up -d

# Check logs for errors
docker compose logs -f
```

### Zero-Downtime Updates (Blue-Green Deployment)

```bash
# Create backup before update
./backup.sh

# Pull latest code
git pull

# Build new images with different tag
docker compose -f docker-compose.yml build --no-cache

# Start new containers alongside old ones
docker compose up -d --scale backend=2 --scale frontend=2

# Stop old containers
docker compose stop backend frontend

# Remove old containers
docker compose rm -f backend frontend
```

---

## 🛠️ Troubleshooting

### Backend Not Starting

```bash
# Check logs
docker compose logs backend

# Common issues:
# - Database connection failed → Check DB credentials in .env
# - Port already in use → Change BACKEND_PORT in .env
# - Missing JWT_SECRET → Add to .env
```

### Database Connection Issues

```bash
# Check database status
docker compose ps postgres

# Connect to database
docker compose exec postgres psql -U fieldpro

# Check database logs
docker compose logs postgres
```

### Frontend Not Loading

```bash
# Check Nginx logs
docker compose logs frontend

# Check if backend is reachable
curl http://backend:3001/health

# Rebuild frontend
docker compose build frontend
docker compose up -d frontend
```

### Integration OAuth Errors

```bash
# Check redirect URIs match exactly:
# QuickBooks: https://your-domain.com/api/integrations/quickbooks/callback
# Zoho: https://your-domain.com/api/integrations/zoho/callback
# Google: https://your-domain.com/api/integrations/google/callback

# Check credentials are for correct environment (production vs sandbox)
```

---

## 📞 Support

For issues or questions:
- Check logs: `docker compose logs -f`
- Review documentation: `/docs` in the repository
- Open issue: https://github.com/your-org/fieldpro/issues

---

## 🔐 Security Best Practices

1. **Never commit `.env` to Git**
   ```bash
   # Verify .env is in .gitignore
   grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
   ```

2. **Use strong passwords**
   - Database: 32+ characters
   - JWT Secret: 64+ characters
   - Admin users: 16+ characters

3. **Keep software updated**
   ```bash
   # Update Docker images monthly
   docker compose pull
   docker compose up -d
   ```

4. **Limit SSH access**
   ```bash
   # Disable root login
   sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
   sudo systemctl restart sshd
   ```

5. **Enable fail2ban**
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   ```

---

## 📈 Performance Optimization

### Enable Redis Caching (Optional)

```yaml
# Add to docker-compose.yml
redis:
  image: redis:7-alpine
  container_name: fieldpro-redis
  restart: unless-stopped
  ports:
    - "6379:6379"
  networks:
    - fieldpro-network
```

### Database Performance Tuning

```bash
# Connect to database
docker compose exec postgres psql -U fieldpro

-- Create indexes for frequently queried fields
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled_at ON jobs(scheduled_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM jobs WHERE status = 'pending';
```

### Enable Nginx Caching

```nginx
# Add to frontend Nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
}
```

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Version**: _____________
