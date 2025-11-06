#!/bin/bash

# ================================================
# SUPABASE SECRETS CONFIGURATION SCRIPT
# ================================================
# This script helps you set up all required
# environment secrets for Supabase Edge Functions
# ================================================

set -e

echo "🔐 Supabase Secrets Configuration"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}"
echo ""

# Check if linked
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Not linked to Supabase project${NC}"
    echo "Linking now..."
    supabase link --project-ref wzlqbrglftrkxrfztcqd
fi

echo "This script will help you configure the following secrets:"
echo "  1. RESEND_API_KEY - For sending emails"
echo "  2. SUPABASE_SERVICE_ROLE_KEY - For database access"
echo "  3. VITE_APP_URL - Your production app URL"
echo "  4. SUPABASE_URL - Your Supabase project URL"
echo ""
echo -e "${YELLOW}⚠️  Secrets will be stored securely in Supabase${NC}"
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local default_value=$3

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Setting: ${secret_name}${NC}"
    echo "Description: ${secret_description}"

    if [ -n "$default_value" ]; then
        echo "Current/Default: ${default_value}"
    fi

    echo ""
    read -p "Enter value (or press Enter to skip): " secret_value

    if [ -n "$secret_value" ]; then
        echo "Setting secret..."
        if supabase secrets set "${secret_name}=${secret_value}"; then
            echo -e "${GREEN}✓ ${secret_name} set successfully${NC}"
        else
            echo -e "${RED}✗ Failed to set ${secret_name}${NC}"
        fi
    else
        echo -e "${YELLOW}⊘ Skipped ${secret_name}${NC}"
    fi
}

# 1. RESEND_API_KEY
set_secret \
    "RESEND_API_KEY" \
    "Resend API key for sending emails (starts with re_)" \
    ""

# 2. SUPABASE_SERVICE_ROLE_KEY
echo ""
echo -e "${YELLOW}📝 To get your Service Role Key:${NC}"
echo "   1. Go to: https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd/settings/api"
echo "   2. Scroll to 'Service Role Key' (secret)"
echo "   3. Click to reveal and copy"
echo ""

set_secret \
    "SUPABASE_SERVICE_ROLE_KEY" \
    "Supabase Service Role key (NOT the anon key!)" \
    ""

# 3. VITE_APP_URL
set_secret \
    "VITE_APP_URL" \
    "Your production app URL" \
    "https://groundupcareers.app"

# 4. SUPABASE_URL
set_secret \
    "SUPABASE_URL" \
    "Your Supabase project URL" \
    "https://wzlqbrglftrkxrfztcqd.supabase.co"

# Summary
echo ""
echo "=============================================="
echo "📊 Configuration Complete!"
echo "=============================================="
echo ""
echo "Verifying secrets..."
echo ""

supabase secrets list

echo ""
echo -e "${GREEN}✅ All secrets configured!${NC}"
echo ""
echo "Next steps:"
echo "  1. Deploy edge functions: ./deploy-functions.sh"
echo "  2. Test email sending"
echo "  3. Deploy to Vercel"
echo ""
