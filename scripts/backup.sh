#!/bin/bash
# Database Backup Script
# Creates a backup of the Supabase database
#
# Usage:
#   ./scripts/backup.sh                    # Backup to default location
#   ./scripts/backup.sh /path/to/backup    # Backup to custom location
#
# Requirements:
#   - Supabase CLI installed: npm install -g supabase
#   - Supabase project linked: supabase link --project-ref YOUR_PROJECT_REF
#   - Or: PostgreSQL client (pg_dump) with database connection string

set -e

# Configuration
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="backup-${TIMESTAMP}.sql"
BACKUP_FILE_COMPRESSED="${BACKUP_FILE}.gz"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backup directory exists, create if not
if [ ! -d "$BACKUP_DIR" ]; then
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

log_info "Starting database backup..."
log_info "Backup directory: $BACKUP_DIR"
log_info "Timestamp: $TIMESTAMP"

# Method 1: Try Supabase CLI
if command -v supabase &> /dev/null; then
    log_info "Using Supabase CLI for backup..."
    
    # Check if project is linked
    if [ -f ".supabase/config.toml" ]; then
        log_info "Project is linked, creating backup..."
        
        # Create backup using Supabase CLI
        if supabase db dump -f "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null; then
            log_info "Backup created successfully: $BACKUP_DIR/$BACKUP_FILE"
            BACKUP_METHOD="supabase"
        else
            log_warn "Supabase CLI backup failed, trying alternative method..."
            BACKUP_METHOD=""
        fi
    else
        log_warn "Supabase project not linked. Run: supabase link --project-ref YOUR_PROJECT_REF"
        BACKUP_METHOD=""
    fi
else
    log_warn "Supabase CLI not found. Install with: npm install -g supabase"
    BACKUP_METHOD=""
fi

# Method 2: Try pg_dump (if Supabase CLI failed or not available)
if [ -z "$BACKUP_METHOD" ]; then
    if command -v pg_dump &> /dev/null; then
        log_info "Using pg_dump for backup..."
        
        # Check for database connection string
        if [ -n "$DATABASE_URL" ]; then
            log_info "Using DATABASE_URL environment variable..."
            pg_dump "$DATABASE_URL" \
                --no-owner \
                --no-acl \
                --clean \
                --if-exists \
                -f "$BACKUP_DIR/$BACKUP_FILE"
            
            if [ $? -eq 0 ]; then
                log_info "Backup created successfully: $BACKUP_DIR/$BACKUP_FILE"
                BACKUP_METHOD="pg_dump"
            else
                log_error "pg_dump backup failed"
                exit 1
            fi
        else
            log_error "DATABASE_URL not set. Set it as an environment variable:"
            log_error "  export DATABASE_URL='postgresql://user:password@host:port/database'"
            log_error ""
            log_error "Or get connection string from Supabase Dashboard:"
            log_error "  Settings → Database → Connection string"
            exit 1
        fi
    else
        log_error "Neither Supabase CLI nor pg_dump found."
        log_error "Please install one of the following:"
        log_error "  1. Supabase CLI: npm install -g supabase"
        log_error "  2. PostgreSQL client: brew install postgresql (macOS) or apt-get install postgresql-client (Linux)"
        exit 1
    fi
fi

# Compress backup
log_info "Compressing backup..."
if command -v gzip &> /dev/null; then
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    FINAL_BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE_COMPRESSED"
    log_info "Backup compressed: $FINAL_BACKUP_FILE"
else
    FINAL_BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    log_warn "gzip not found, backup not compressed"
fi

# Get backup size
BACKUP_SIZE=$(du -h "$FINAL_BACKUP_FILE" | cut -f1)
log_info "Backup size: $BACKUP_SIZE"

# Verify backup integrity
log_info "Verifying backup integrity..."
if [[ "$FINAL_BACKUP_FILE" == *.gz ]]; then
    if gzip -t "$FINAL_BACKUP_FILE" 2>/dev/null; then
        log_info "Backup integrity verified ✓"
    else
        log_error "Backup integrity check failed!"
        exit 1
    fi
else
    # For SQL files, check if file is not empty and contains SQL
    if [ -s "$FINAL_BACKUP_FILE" ] && head -n 1 "$FINAL_BACKUP_FILE" | grep -q "PostgreSQL\|CREATE\|SET"; then
        log_info "Backup integrity verified ✓"
    else
        log_error "Backup integrity check failed!"
        exit 1
    fi
fi

# Clean up old backups (keep backups for RETENTION_DAYS)
log_info "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "backup-*.sql*" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
log_info "Old backups cleaned up"

# Summary
log_info "════════════════════════════════════════"
log_info "Backup completed successfully!"
log_info "════════════════════════════════════════"
log_info "Method: $BACKUP_METHOD"
log_info "File: $FINAL_BACKUP_FILE"
log_info "Size: $BACKUP_SIZE"
log_info "Timestamp: $TIMESTAMP"
log_info "════════════════════════════════════════"

# Optional: Upload to cloud storage
if [ -n "$BACKUP_UPLOAD_COMMAND" ]; then
    log_info "Uploading backup to cloud storage..."
    eval "$BACKUP_UPLOAD_COMMAND $FINAL_BACKUP_FILE"
    log_info "Upload completed"
fi

# Optional: Send notification
if [ -n "$BACKUP_NOTIFICATION_WEBHOOK" ]; then
    log_info "Sending backup notification..."
    curl -X POST "$BACKUP_NOTIFICATION_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"status\": \"success\", \"file\": \"$FINAL_BACKUP_FILE\", \"size\": \"$BACKUP_SIZE\", \"timestamp\": \"$TIMESTAMP\"}" \
        > /dev/null 2>&1 || log_warn "Notification failed (non-critical)"
fi

exit 0
