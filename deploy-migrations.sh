#!/bin/bash

# ================================================
# SUPABASE DATABASE MIGRATIONS DEPLOYMENT SCRIPT
# ================================================
# This script deploys all database migrations
# to your remote Supabase project
# ================================================

set -e  # Exit on any error

echo "🗄️  Starting Database Migrations Deployment"
echo "=============================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo "Please install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}"
echo ""

# Check if linked to remote project
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${BLUE}🔗 Linking to remote project...${NC}"
    echo "Project ID from config: wzlqbrglftrkxrfztcqd"
    supabase link --project-ref wzlqbrglftrkxrfztcqd
    echo ""
fi

echo -e "${YELLOW}⚠️  WARNING: This will apply migrations to your production database${NC}"
echo -e "${YELLOW}Make sure you have a backup before proceeding!${NC}"
echo ""
read -p "Continue with migration? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}📤 Pushing migrations to remote database...${NC}"
echo ""

# Push migrations
if supabase db push; then
    echo ""
    echo -e "${GREEN}✅ All migrations applied successfully!${NC}"
    echo ""
    echo "=============================================="
    echo "📊 Migration Summary"
    echo "=============================================="

    # Count migration files
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    echo "Total migration files: $MIGRATION_COUNT"
    echo ""

    echo "Recent migrations:"
    ls -1t supabase/migrations/*.sql | head -5

else
    echo ""
    echo -e "${RED}❌ Migration failed!${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check if you're linked to the correct project:"
    echo "   supabase projects list"
    echo ""
    echo "2. Verify your database connection:"
    echo "   supabase db remote show"
    echo ""
    echo "3. Check for migration errors:"
    echo "   supabase db diff"
    echo ""
    exit 1
fi

echo ""
echo "=============================================="
echo "🔍 Next Steps:"
echo "=============================================="
echo "1. Verify database schema in Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd/editor"
echo ""
echo "2. Test your tables:"
echo "   - profiles"
echo "   - clients"
echo "   - candidates"
echo "   - job_posts"
echo "   - email_alerts"
echo ""
echo "3. Check RLS policies are enabled"
echo ""
echo "✅ Migration deployment complete!"
