#!/bin/bash

# Stripe Webhook Deployment Script
# This script helps deploy the stripe-webhook function with the correct configuration

set -e  # Exit on error

echo "================================================"
echo "  Stripe Webhook Deployment Script"
echo "================================================"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo ""
    echo "Please install it first:"
    echo "  macOS:   brew install supabase/tap/supabase"
    echo "  Windows: scoop install supabase"
    echo "  Linux:   See https://supabase.com/docs/guides/cli"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: supabase/config.toml not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if the project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Project not linked to Supabase"
    echo "Linking project..."
    supabase link --project-ref wzlqbrglftrkxrfztcqd
    echo ""
fi

# Deploy the function
echo "📦 Deploying stripe-webhook function..."
echo ""

# Deploy with --no-verify-jwt flag to ensure JWT verification is disabled
supabase functions deploy stripe-webhook --no-verify-jwt

echo ""
echo "================================================"
echo "✅ Deployment complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Verify environment variables are set:"
echo "   supabase secrets list"
echo ""
echo "2. If secrets are missing, set them:"
echo "   supabase secrets set STRIPE_SECRET_KEY=sk_..."
echo "   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..."
echo "   supabase secrets set RESEND_API_KEY=re_..."
echo ""
echo "3. Test the webhook endpoint:"
echo "   curl -X POST https://wzlqbrglftrkxrfztcqd.supabase.co/functions/v1/stripe-webhook \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'stripe-signature: test' \\"
echo "     -d '{\"test\": \"data\"}'"
echo ""
echo "4. Test from Stripe Dashboard:"
echo "   https://dashboard.stripe.com/webhooks"
echo ""
echo "For more details, see DEPLOYMENT_FIX.md"
echo ""
