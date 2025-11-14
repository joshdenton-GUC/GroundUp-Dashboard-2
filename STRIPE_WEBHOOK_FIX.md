# 🚨 Stripe Webhook Fix - Quick Start

Your Stripe webhook endpoint is failing because it needs to be redeployed with JWT verification disabled.

## The Problem

Stripe is reporting:
- **66 failed webhook delivery attempts**
- Error: "Could not connect to the server"
- Endpoint: `https://wzlqbrglftrkxrfztcqd.supabase.co/functions/v1/stripe-webhook`

The function returns **403 Forbidden** ("Access denied") because it was deployed with JWT authentication enabled.

## The Solution (5 minutes)

### Quick Fix

```bash
# 1. Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase  # macOS
# or
scoop install supabase  # Windows

# 2. Link your project
cd /path/to/GroundUp-Dashboard-2
supabase link --project-ref wzlqbrglftrkxrfztcqd

# 3. Deploy the function
supabase functions deploy stripe-webhook --no-verify-jwt

# 4. Verify it works
curl -X POST https://wzlqbrglftrkxrfztcqd.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"test": "data"}'

# Should return a signature validation error instead of "Access denied"
```

### Even Quicker (use the script)

```bash
cd /path/to/GroundUp-Dashboard-2
./supabase/functions/stripe-webhook/deploy.sh
```

## What This Does

1. **Redeploys** the `stripe-webhook` function with `--no-verify-jwt` flag
2. This allows Stripe to send webhooks without authentication
3. Security is maintained through Stripe's signature verification (already implemented)

## Required Environment Variables

Make sure these are set in Supabase:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Where to find these:**
- STRIPE_SECRET_KEY: [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/apikeys)
- STRIPE_WEBHOOK_SECRET: [Stripe Dashboard → Webhooks → Your webhook → Signing secret](https://dashboard.stripe.com/webhooks)
- SUPABASE_SERVICE_ROLE_KEY: [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd/settings/api)

## After Deployment

1. **Test from Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/webhooks
   - Click on your webhook
   - Click "Send test webhook"
   - Select `payment_intent.succeeded`
   - Verify it shows as successful (200 OK)

2. **Monitor the function:**
   ```bash
   supabase functions logs stripe-webhook --tail
   ```

## Detailed Documentation

For more information, see:
- 📖 [Complete Deployment Guide](./supabase/functions/stripe-webhook/DEPLOYMENT_FIX.md)
- 🔐 [Environment Variables Reference](./supabase/functions/stripe-webhook/ENV_VARIABLES.md)
- 🚀 [Deployment Script](./supabase/functions/stripe-webhook/deploy.sh)

## Troubleshooting

### Still getting 403 after deployment?
1. Check that `verify_jwt = false` in `supabase/config.toml`
2. Redeploy with: `supabase functions deploy stripe-webhook --no-verify-jwt`
3. Clear Stripe's cache by editing the webhook URL (even if unchanged)

### Stripe webhooks timing out?
- Check function logs: `supabase functions logs stripe-webhook`
- Verify environment variables are set: `supabase secrets list`

### Need help?
- Check the complete guide in `supabase/functions/stripe-webhook/DEPLOYMENT_FIX.md`
- Review Supabase Edge Functions docs: https://supabase.com/docs/guides/functions

---

**⏰ Time Sensitive:** Stripe will stop sending webhook events on **November 20, 2025 at 2:09:04 AM UTC** if this isn't fixed.
