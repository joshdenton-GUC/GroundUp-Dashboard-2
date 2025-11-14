# Stripe Webhook Deployment Fix

## Problem

The Stripe webhook endpoint at `https://wzlqbrglftrkxrfztcqd.supabase.co/functions/v1/stripe-webhook` is returning a **403 Forbidden** error with the message "Access denied". This prevents Stripe from successfully delivering webhook events to your application.

### Root Cause

The function was previously deployed with JWT verification enabled, which blocks unauthenticated requests. Even though the `config.toml` file has been updated with `verify_jwt = false`, **the function must be redeployed** for the configuration change to take effect.

## Solution

Follow these steps to redeploy the function with the correct configuration:

### Step 1: Verify Configuration

Ensure your `supabase/config.toml` contains:

```toml
[functions.stripe-webhook]
verify_jwt = false
```

✅ This configuration is already correct in your codebase.

### Step 2: Install Supabase CLI (if not already installed)

**macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Alternative (npx):**
```bash
# No installation needed, use npx for one-time commands
npx supabase@latest --version
```

### Step 3: Link Your Project

```bash
# Navigate to your project directory
cd /path/to/GroundUp-Dashboard-2

# Link to your Supabase project
supabase link --project-ref wzlqbrglftrkxrfztcqd
```

You'll be prompted to enter your Supabase access token. Get it from: https://supabase.com/dashboard/account/tokens

### Step 4: Deploy the Function

```bash
# Deploy the stripe-webhook function with JWT verification disabled
supabase functions deploy stripe-webhook --no-verify-jwt
```

Or use the config.toml setting:

```bash
# This will read the verify_jwt setting from config.toml
supabase functions deploy stripe-webhook
```

### Step 5: Set Environment Variables

Ensure the following secrets are configured in your Supabase project:

```bash
# Set Stripe secrets
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key_here
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_signing_secret_here

# Set Resend API key (for invoice emails)
supabase secrets set RESEND_API_KEY=your_resend_api_key_here

# Supabase credentials (should already be set)
supabase secrets set SUPABASE_URL=https://wzlqbrglftrkxrfztcqd.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URL
supabase secrets set VITE_APP_URL=https://groundupcareers.app/
```

**Where to find these values:**

- **STRIPE_SECRET_KEY**: Stripe Dashboard → Developers → API Keys → Secret key
- **STRIPE_WEBHOOK_SECRET**: Stripe Dashboard → Developers → Webhooks → Click on your webhook → Signing secret
- **RESEND_API_KEY**: Resend Dashboard → API Keys
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase Dashboard → Project Settings → API → service_role key (secret)

### Step 6: Verify the Fix

Test the endpoint:

```bash
curl -X POST https://wzlqbrglftrkxrfztcqd.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"test": "data"}'
```

You should now receive a response (likely a signature validation error, which is expected) instead of "Access denied".

### Step 7: Test from Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select an event type (e.g., `payment_intent.succeeded`)
5. Send the test event

The webhook should now successfully receive the event (status 200).

## Alternative: Deploy via Supabase Dashboard

If you don't want to use the CLI:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd
2. Navigate to Edge Functions
3. Find the `stripe-webhook` function
4. Click on the function
5. Update the JWT verification setting to "Disabled"
6. Redeploy the function

## Troubleshooting

### Still getting 403 errors after deployment?

1. **Clear Stripe's webhook cache**: Edit and save your webhook endpoint URL in Stripe Dashboard (even if unchanged)
2. **Verify environment variables are set**: Run `supabase secrets list` to check
3. **Check function logs**:
   ```bash
   supabase functions logs stripe-webhook
   ```
4. **Verify deployment**: Check the Supabase Dashboard → Edge Functions to ensure the function shows as deployed

### Function deploys but Stripe still can't connect?

- Verify the webhook URL in Stripe Dashboard matches exactly: `https://wzlqbrglftrkxrfztcqd.supabase.co/functions/v1/stripe-webhook`
- Check if there are any IP restrictions or firewall rules blocking Stripe's webhooks
- Ensure your Supabase project is not paused or suspended

## Need Help?

- Supabase CLI docs: https://supabase.com/docs/reference/cli/introduction
- Stripe webhook docs: https://stripe.com/docs/webhooks
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
