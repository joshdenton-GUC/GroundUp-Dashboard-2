#!/bin/bash

# ================================================
# SUPABASE EDGE FUNCTIONS DEPLOYMENT SCRIPT
# ================================================
# This script deploys all Supabase Edge Functions
# to your remote Supabase project
# ================================================

set -e  # Exit on any error

echo "🚀 Starting Supabase Edge Functions Deployment"
echo "=============================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo "Please install it from: https://supabase.com/docs/guides/cli"
    echo ""
    echo "Installation options:"
    echo "  - macOS: brew install supabase/tap/supabase"
    echo "  - Linux: Download .deb from https://github.com/supabase/cli/releases"
    echo "  - Windows: scoop install supabase"
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

echo -e "${BLUE}📦 Deploying Edge Functions...${NC}"
echo ""

# List of all edge functions to deploy
FUNCTIONS=(
    "send-email-alert"
    "notify-client"
    "notify-new-client"
    "send-reminder-emails"
    "resend-client-invitation"
    "resend-webhook"
    "stripe-webhook"
    "parse-resume"
    "invite-client"
    "manage-api-keys"
    "audit-log"
    "create-payment-intent"
    "auto-reminder-trigger"
    "get-clients-with-status"
)

# Counter for successful deployments
SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_FUNCTIONS=()

# Deploy each function
for func in "${FUNCTIONS[@]}"; do
    echo -e "${BLUE}Deploying: ${func}${NC}"

    if supabase functions deploy "$func" --no-verify-jwt; then
        echo -e "${GREEN}✓ Successfully deployed: ${func}${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}✗ Failed to deploy: ${func}${NC}"
        ((FAIL_COUNT++))
        FAILED_FUNCTIONS+=("$func")
    fi
    echo ""
done

# Summary
echo "=============================================="
echo "📊 Deployment Summary"
echo "=============================================="
echo -e "${GREEN}✓ Successful: ${SUCCESS_COUNT}${NC}"

if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}✗ Failed: ${FAIL_COUNT}${NC}"
    echo ""
    echo "Failed functions:"
    for func in "${FAILED_FUNCTIONS[@]}"; do
        echo "  - $func"
    done
else
    echo -e "${GREEN}✓ All functions deployed successfully!${NC}"
fi

echo ""
echo "=============================================="
echo "🔐 Next Steps:"
echo "=============================================="
echo "1. Set environment secrets (if not already set):"
echo "   supabase secrets set RESEND_API_KEY=re_your_key"
echo "   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key"
echo "   supabase secrets set VITE_APP_URL=https://groundupcareers.app"
echo ""
echo "2. Verify secrets:"
echo "   supabase secrets list"
echo ""
echo "3. Test a function:"
echo "   supabase functions logs send-email-alert"
echo ""
echo "✅ Deployment complete!"
