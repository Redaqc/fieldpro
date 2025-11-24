#!/bin/bash
# FieldPro FSM - Database Restore Script
# This script restores the PostgreSQL database from a backup file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/var/backups/fieldpro"
COMPOSE_FILE="/opt/fieldpro/docker-compose.yml"

# Function to print colored messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_error "Please do not run this script as root"
    exit 1
fi

# Check if backup file is provided
if [ -z "$1" ]; then
    log_error "Usage: $0 <backup-file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "No backups found in $BACKUP_DIR"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Confirmation prompt
log_warn "This will COMPLETELY REPLACE the current database with the backup!"
log_warn "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Load environment variables
if [ -f "/opt/fieldpro/.env" ]; then
    source /opt/fieldpro/.env
else
    log_error ".env file not found at /opt/fieldpro/.env"
    exit 1
fi

# Get database credentials from environment
DB_NAME="${DB_NAME:-fieldpro}"
DB_USER="${DB_USER:-fieldpro}"

log_info "Starting database restore process..."

# Step 1: Create a backup of current database before restore
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SAFETY_BACKUP="$BACKUP_DIR/pre_restore_$TIMESTAMP.sql.gz"

log_info "Creating safety backup of current database..."
docker compose -f $COMPOSE_FILE exec -T postgres pg_dump -U $DB_USER $DB_NAME | gzip > $SAFETY_BACKUP

if [ $? -eq 0 ]; then
    log_info "Safety backup created: $SAFETY_BACKUP"
else
    log_error "Failed to create safety backup. Aborting restore."
    exit 1
fi

# Step 2: Stop backend service to prevent connections
log_info "Stopping backend service..."
docker compose -f $COMPOSE_FILE stop backend

# Step 3: Drop existing connections
log_info "Terminating existing database connections..."
docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER -d postgres <<EOF
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME'
  AND pid <> pg_backend_pid();
EOF

# Step 4: Drop and recreate database
log_info "Dropping and recreating database..."
docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER -d postgres <<EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;
EOF

if [ $? -ne 0 ]; then
    log_error "Failed to recreate database. Restoring from safety backup..."
    gunzip < $SAFETY_BACKUP | docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER -d postgres
    docker compose -f $COMPOSE_FILE start backend
    exit 1
fi

# Step 5: Restore from backup
log_info "Restoring database from $BACKUP_FILE..."
gunzip < $BACKUP_FILE | docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER $DB_NAME

if [ $? -ne 0 ]; then
    log_error "Failed to restore database. Restoring from safety backup..."
    gunzip < $SAFETY_BACKUP | docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER -d postgres
    docker compose -f $COMPOSE_FILE start backend
    exit 1
fi

# Step 6: Restart backend service
log_info "Restarting backend service..."
docker compose -f $COMPOSE_FILE start backend

# Wait for backend to be healthy
log_info "Waiting for backend to be healthy..."
sleep 5

# Check if backend is responding
for i in {1..30}; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_info "Backend is healthy!"
        break
    fi

    if [ $i -eq 30 ]; then
        log_error "Backend failed to start after restore. Check logs with: docker compose logs backend"
        exit 1
    fi

    sleep 2
done

# Step 7: Verify restore
log_info "Verifying database restore..."
TABLES_COUNT=$(docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

log_info "Database contains $TABLES_COUNT tables"

if [ $TABLES_COUNT -gt 0 ]; then
    log_info "✅ Database restore completed successfully!"
    log_info ""
    log_info "Safety backup saved at: $SAFETY_BACKUP"
    log_info "You can delete it after verifying the restore: rm $SAFETY_BACKUP"
else
    log_error "Database restore may have failed - no tables found!"
    exit 1
fi
