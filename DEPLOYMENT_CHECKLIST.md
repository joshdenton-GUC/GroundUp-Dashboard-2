# 🚀 GroundUp Careers - Complete Deployment Checklist

This is your step-by-step checklist to deploy the entire GroundUp Dashboard to production with Supabase, Resend, and Vercel.

---

## 📊 Current Configuration Status

### ✅ Already Configured
- [x] Supabase project created: `wzlqbrglftrkxrfztcqd`
- [x] Supabase URL: `https://wzlqbrglftrkxrfztcqd.supabase.co`
- [x] Environment variables in `.env` file
- [x] Edge functions code ready (14 functions)
- [x] Database migrations ready (50+ migrations)
- [x] Stripe integration configured

### 🔧 Needs Configuration
- [ ] Resend account and API key
- [ ] Domain DNS records for Resend
- [ ] Supabase Edge Function secrets
- [ ] Vercel deployment and environment variables

---

## 🗂️ Phase 1: Supabase Setup

### Step 1: Install Supabase CLI

**On macOS:**
```bash
brew install supabase/tap/supabase
```

**On Linux (Ubuntu/Debian):**
```bash
# Download the latest .deb package
wget https://github.com/supabase/cli/releases/download/v2.54.11/supabase_2.54.11_linux_amd64.deb
sudo dpkg -i supabase_2.54.11_linux_amd64.deb
```

**On Windows:**
```powershell
scoop install supabase
```

**Verify installation:**
```bash
supabase --version
```

---

### Step 2: Link Your Project

```bash
# From the project root directory
cd /path/to/GroundUp-Dashboard

# Link to your remote Supabase project
supabase link --project-ref wzlqbrglftrkxrfztcqd

# You'll be prompted to log in via browser
# Then confirm the project link
```

**Expected output:**
```
Linked to project: wzlqbrglftrkxrfztcqd
```

---

### Step 3: Deploy Database Migrations

```bash
# Run the migration deployment script
./deploy-migrations.sh

# OR manually:
supabase db push
```

**This will create:**
- `profiles` table (user profiles with roles)
- `clients` table (company/client information)
- `candidates` table (resume data)
- `job_posts` table (job listings)
- `email_alerts` table (email notification tracking)
- `payments` table (Stripe payment records)
- All RLS (Row Level Security) policies
- Database triggers and functions

**Verify in Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd/editor
2. Check all tables exist
3. Verify RLS policies are enabled (green shield icons)

---

### Step 4: Deploy Edge Functions

```bash
# Run the function deployment script
./deploy-functions.sh

# OR manually deploy individual functions:
supabase functions deploy send-email-alert
supabase functions deploy notify-client
supabase functions deploy parse-resume
# ... etc
```

**Functions that will be deployed (14 total):**
1. `send-email-alert` - Send email notifications via Resend
2. `notify-client` - Notify clients about candidate status
3. `notify-new-client` - Welcome email for new clients
4. `send-reminder-emails` - Automated reminder system
5. `resend-client-invitation` - Resend invitation emails
6. `resend-webhook` - Handle Resend webhooks
7. `stripe-webhook` - Handle Stripe payment webhooks
8. `parse-resume` - AI-powered resume parsing (Gemini)
9. `invite-client` - Send client invitation emails
10. `manage-api-keys` - API key management
11. `audit-log` - Audit trail logging
12. `create-payment-intent` - Stripe payment intent creation
13. `auto-reminder-trigger` - Automatic reminder triggers
14. `get-clients-with-status` - Client status queries

---

## 📧 Phase 2: Resend Email Setup

### Step 1: Create Resend Account

1. **Visit:** https://resend.com
2. **Sign up** with your email
3. **Verify** your email address

---

### Step 2: Add Your Domain

1. In Resend Dashboard, click **"Domains"**
2. Click **"+ Add Domain"**
3. Enter: `groundupcareers.com` (or your actual domain)
4. Click **"Add Domain"**

---

### Step 3: Get DNS Records

After adding your domain, Resend will show you DNS records like:

```
Record 1: DKIM (TXT)
Type:     TXT
Name:     resend._domainkey
Value:    p=MIGfMA0GCSqGSIb3DQEBAQUAA... (long string)
TTL:      3600

Record 2: MX (Feedback)
Type:     MX
Name:     @
Value:    feedback-smtp.resend.com
Priority: 10
TTL:      3600
```

**⚠️ IMPORTANT:** Copy these EXACT values - you'll need them in the next step.

---

### Step 4: Configure DNS Records

Go to your domain registrar and add the DNS records from Resend.

**Cloudflare (Recommended):**
1. Log in to https://dash.cloudflare.com
2. Select your domain
3. Go to **DNS** → **Records**
4. Add the TXT record:
   - Type: `TXT`
   - Name: `resend._domainkey`
   - Content: [paste from Resend]
   - Proxy: **DNS only** (grey cloud)
5. Add the MX record:
   - Type: `MX`
   - Name: `@`
   - Mail server: `feedback-smtp.resend.com`
   - Priority: `10`
   - Proxy: **DNS only** (grey cloud)

**Other DNS providers:** See `DNS_SETUP_RESEND.md` for detailed instructions.

---

### Step 5: Verify Domain

1. Wait 10-30 minutes for DNS propagation
2. Check propagation: https://dnschecker.org
   - Search: `resend._domainkey.groundupcareers.com`
   - Type: TXT
3. In Resend Dashboard, click **"Verify Domain"**
4. Status should show: ✅ **Verified**

---

### Step 6: Get Resend API Key

1. In Resend Dashboard, click **"API Keys"**
2. Click **"+ Create API Key"**
3. Settings:
   - Name: `GroundUp Production`
   - Permission: `Sending access`
4. Click **"Create"**
5. **⚠️ COPY THE KEY NOW** (starts with `re_`) - you can only see it once!

**Example:** `re_abc123def456ghi789jkl012mno345pqr678`

**Save this key** - you'll need it in the next phase.

---

## 🔐 Phase 3: Configure Supabase Secrets

These environment variables are needed by your Edge Functions to send emails and interact with the database.

### Set Required Secrets

```bash
# 1. Resend API Key (from Phase 2, Step 6)
supabase secrets set RESEND_API_KEY=re_your_actual_key_here

# 2. Supabase Service Role Key
# Get from: https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd/settings/api
# Under "Service Role Key" (secret) - NOT the anon key!
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 3. App URL
supabase secrets set VITE_APP_URL=https://groundupcareers.app

# 4. Supabase URL (already in .env, but also needed by functions)
supabase secrets set SUPABASE_URL=https://wzlqbrglftrkxrfztcqd.supabase.co
```

### Verify Secrets

```bash
supabase secrets list
```

**Expected output:**
```
RESEND_API_KEY
SUPABASE_SERVICE_ROLE_KEY
VITE_APP_URL
SUPABASE_URL
```

---

## ☁️ Phase 4: Vercel Deployment

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Connect to Vercel

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to: https://vercel.com
2. Click **"New Project"**
3. Import your GitHub repository: `GustheTrader/GroundUp-Dashboard`
4. Configure project:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

**Option B: Via CLI**
```bash
vercel login
vercel link
vercel --prod
```

---

### Step 3: Add Environment Variables to Vercel

In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**, add:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://wzlqbrglftrkxrfztcqd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bHFicmdsZnRya3hyZnp0Y3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDAyMzMsImV4cCI6MjA3MzcxNjIzM30.e9KYx_y38g6vARC-CXVqonSjH9ih_82ZuBhuUnK1BtE
VITE_SUPABASE_PROJECT_ID=byoaftebddfhtxhqrwju
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5b2FmdGViZGRmaHR4aHFyd2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzEzMzgsImV4cCI6MjA3MzYwNzMzOH0.02Rbt5E_sjgJoowMjvq_jI1gtdNrqqY6mF28nL4EKl0

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51R7rIRDAcCu9dUuDqShaD4Ol97RL4QwmMoohvAa6qypo1SNRhb4bDYSCpxjdCuZtcLYWggb4lVTOJ7YaF7HpP8fJ008xxS2HCP

# App Configuration
VITE_APP_URL=https://groundupcareers.app/

# Gemini AI (Optional - for resume parsing)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**⚠️ Important:**
- Make sure to set these for **Production**, **Preview**, and **Development** environments
- Click **"Save"** after adding each variable
- Redeploy if variables were added after initial deployment

---

### Step 4: Configure Custom Domain

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your custom domain: `groundupcareers.app`
3. Follow Vercel's DNS instructions:
   - Add A record pointing to Vercel's IP
   - Or add CNAME record pointing to `cname.vercel-dns.com`
4. Wait for DNS propagation (can take up to 48 hours)

---

### Step 5: Deploy to Production

**Option A: Via Git Push (Recommended)**
```bash
git add .
git commit -m "Configure production deployment"
git push origin main
```

Vercel will automatically deploy when you push to your main branch.

**Option B: Via CLI**
```bash
vercel --prod
```

---

## ✅ Phase 5: Testing & Verification

### Test 1: Verify Deployment

1. Visit your production URL: https://groundupcareers.app
2. Check that the app loads without errors
3. Open browser console (F12) - no red errors should appear

---

### Test 2: Test Authentication

1. Click **"Sign Up"**
2. Create a new account with a real email
3. Check that you receive a confirmation email (if enabled)
4. Log in successfully

---

### Test 3: Test Database Connection

1. After logging in, navigate to different pages
2. Try creating a client or uploading a resume
3. Check Supabase Dashboard to verify data is being saved:
   - https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd/editor

---

### Test 4: Test Email Sending

1. Upload a test resume as an admin
2. Check that email notification is sent
3. Verify in Resend Dashboard → **Emails**
4. Check delivery status

---

### Test 5: Check Edge Function Logs

```bash
# View logs for a specific function
supabase functions logs send-email-alert

# Or check in Supabase Dashboard:
# Edge Functions → select function → Logs tab
```

---

## 🐛 Troubleshooting

### Issue: Edge functions not working

**Solutions:**
1. Check secrets are set:
   ```bash
   supabase secrets list
   ```
2. Check function logs:
   ```bash
   supabase functions logs send-email-alert
   ```
3. Verify RESEND_API_KEY is correct
4. Check CORS headers in function code

---

### Issue: Emails not sending

**Solutions:**
1. Verify Resend domain is verified (green checkmark)
2. Check RESEND_API_KEY is set in Supabase secrets
3. Check Resend Dashboard → Emails for error messages
4. Verify DNS records are correct: https://dnschecker.org
5. Check function logs for errors

---

### Issue: Database permission errors

**Solutions:**
1. Check RLS policies are enabled
2. Verify user role is set correctly in `profiles` table
3. Check auth.uid() matches profile.id
4. Review RLS policy conditions in migrations

---

### Issue: Vercel build failing

**Solutions:**
1. Check all environment variables are set
2. Verify build command is correct: `npm run build`
3. Check for TypeScript errors: `npm run build` locally
4. Review Vercel build logs

---

## 📋 Final Checklist

Before going live, verify:

- [ ] Supabase project linked and migrations deployed
- [ ] All 14 edge functions deployed successfully
- [ ] Resend domain verified (green checkmark)
- [ ] Resend API key created and saved
- [ ] Supabase secrets set (RESEND_API_KEY, etc.)
- [ ] Vercel project connected to GitHub
- [ ] All Vercel environment variables set
- [ ] Custom domain configured in Vercel
- [ ] Authentication working (sign up, log in)
- [ ] Database writes working (test data saved)
- [ ] Email sending working (test email received)
- [ ] No console errors in production
- [ ] All pages load correctly
- [ ] Stripe payments working (if applicable)

---

## 📚 Additional Resources

- **Supabase Dashboard:** https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd
- **Resend Dashboard:** https://resend.com/emails
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Setup Guide:** See `SETUP_GUIDE.md`
- **DNS Setup:** See `DNS_SETUP_RESEND.md`

---

## 🎯 Quick Commands Reference

```bash
# Link Supabase project
supabase link --project-ref wzlqbrglftrkxrfztcqd

# Deploy migrations
./deploy-migrations.sh

# Deploy functions
./deploy-functions.sh

# Set secrets
supabase secrets set RESEND_API_KEY=re_your_key

# List secrets
supabase secrets list

# View function logs
supabase functions logs send-email-alert

# Deploy to Vercel
vercel --prod
```

---

**🎉 Congratulations!** Once all items are checked off, your GroundUp Dashboard is fully deployed and ready for production use!

**Questions or issues?** Check the troubleshooting section or review the detailed setup guides.
