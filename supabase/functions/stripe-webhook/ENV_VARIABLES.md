# Required Environment Variables for Stripe Webhook

This document lists all environment variables required by the `stripe-webhook` Edge Function.

## Required Variables

### Stripe Configuration

#### `STRIPE_SECRET_KEY` (Required)
- **Description**: Your Stripe secret key used to initialize the Stripe SDK
- **Format**: `sk_live_...` or `sk_test_...`
- **Where to find**: Stripe Dashboard → Developers → API Keys → Secret key
- **Usage**: Used to verify webhook signatures and interact with Stripe API

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_51xxxxxxxxxxxxx
```

#### `STRIPE_WEBHOOK_SECRET` (Required)
- **Description**: Webhook signing secret used to verify that webhook events come from Stripe
- **Format**: `whsec_...`
- **Where to find**:
  1. Go to Stripe Dashboard → Developers → Webhooks
  2. Click on your webhook endpoint
  3. Click "Reveal" next to "Signing secret"
- **Usage**: Used to verify webhook signature and prevent spoofed webhook requests

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

⚠️ **Important**: Each webhook endpoint has its own signing secret. If you recreate the webhook endpoint in Stripe, you'll need to update this value.

### Supabase Configuration

#### `SUPABASE_URL` (Required)
- **Description**: Your Supabase project URL
- **Format**: `https://[project-ref].supabase.co`
- **Value**: `https://wzlqbrglftrkxrfztcqd.supabase.co`
- **Where to find**: Supabase Dashboard → Project Settings → API
- **Usage**: Used to initialize Supabase client for database operations

```bash
supabase secrets set SUPABASE_URL=https://wzlqbrglftrkxrfztcqd.supabase.co
```

#### `SUPABASE_SERVICE_ROLE_KEY` (Required)
- **Description**: Service role key with admin privileges
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Project Settings → API → service_role key (click "Reveal" to see it)
- **Usage**: Used to bypass Row Level Security (RLS) policies and perform admin operations
- **Security**: ⚠️ Keep this secret! Never commit it to version control

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Email Configuration

#### `RESEND_API_KEY` (Optional but Recommended)
- **Description**: Resend API key for sending invoice and notification emails
- **Format**: `re_...`
- **Where to find**: Resend Dashboard → API Keys → Create API Key
- **Usage**: Used to send payment receipt emails and job posting notifications
- **Fallback**: If not set, the function will log email content instead of sending

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Application Configuration

#### `VITE_APP_URL` (Optional)
- **Description**: Your application's public URL
- **Format**: `https://yourdomain.com/`
- **Default**: `https://groundupcareers.com`
- **Value**: `https://groundupcareers.app/`
- **Usage**: Used to generate links in notification emails

```bash
supabase secrets set VITE_APP_URL=https://groundupcareers.app/
```

## Setting All Variables at Once

Use this template to set all required variables:

```bash
# Stripe
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Supabase
supabase secrets set SUPABASE_URL=https://wzlqbrglftrkxrfztcqd.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email (Optional)
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx

# App URL (Optional)
supabase secrets set VITE_APP_URL=https://groundupcareers.app/
```

## Verifying Variables

List all configured secrets (values are hidden for security):

```bash
supabase secrets list
```

## Checking Function Logs

To see if the function is accessing variables correctly:

```bash
supabase functions logs stripe-webhook --tail
```

Look for error messages like:
- "Missing stripe signature" → Stripe is sending webhooks but signature validation failed
- "Invalid signature" → STRIPE_WEBHOOK_SECRET is incorrect or outdated
- "Resend initialized successfully" → RESEND_API_KEY is set correctly
- "RESEND_API_KEY not found" → RESEND_API_KEY is not set

## Security Best Practices

1. **Never commit secrets to version control**
   - Use `.env` files locally (add to `.gitignore`)
   - Use `supabase secrets` for production

2. **Rotate secrets regularly**
   - Update webhook signing secret if you suspect it's compromised
   - Rotate API keys every 90 days

3. **Use different keys for test and production**
   - Test mode: `sk_test_...`, `whsec_test_...`
   - Live mode: `sk_live_...`, `whsec_live_...`

4. **Limit key permissions**
   - Use restricted API keys in Stripe when possible
   - Only grant necessary permissions

## Troubleshooting

### "Access denied" error
- The function needs to be redeployed with `verify_jwt = false` (see DEPLOYMENT_FIX.md)

### "Invalid signature" error
- STRIPE_WEBHOOK_SECRET is incorrect or outdated
- Verify the secret in Stripe Dashboard matches the one set in Supabase

### "Missing stripe signature" error
- The request is not coming from Stripe
- Check that the webhook URL in Stripe Dashboard is correct

### Emails not being sent
- Check if RESEND_API_KEY is set: `supabase secrets list`
- Verify the API key is valid in Resend Dashboard
- Check function logs: `supabase functions logs stripe-webhook`
