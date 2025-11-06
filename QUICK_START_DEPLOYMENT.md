# ⚡ Quick Start: Deploy GroundUp Dashboard

Get your GroundUp Dashboard deployed in 30 minutes! Follow these steps in order.

---

## 🎯 What You'll Need

1. **Supabase CLI installed** on your local machine
2. **Resend account** with domain verified
3. **Vercel account** connected to GitHub
4. **30 minutes** of your time

---

## 📝 Step-by-Step (30 Minutes)

### ⏱️ Step 1: Install Supabase CLI (5 min)

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
wget https://github.com/supabase/cli/releases/download/v2.54.11/supabase_2.54.11_linux_amd64.deb
sudo dpkg -i supabase_2.54.11_linux_amd64.deb
```

**Windows:**
```powershell
scoop install supabase
```

**Verify:**
```bash
supabase --version
```

---

### ⏱️ Step 2: Deploy Database (5 min)

```bash
cd /path/to/GroundUp-Dashboard

# Link to your Supabase project
supabase link --project-ref wzlqbrglftrkxrfztcqd

# Deploy migrations
./deploy-migrations.sh
```

✅ **Check:** Visit [Supabase Dashboard](https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd/editor) - you should see all tables

---

### ⏱️ Step 3: Setup Resend (10 min)

1. **Create account:** https://resend.com
2. **Add domain:** `groundupcareers.com` (or your domain)
3. **Get DNS records** from Resend dashboard
4. **Add DNS records** to your domain registrar:
   - TXT record: `resend._domainkey`
   - MX record: `feedback-smtp.resend.com`
5. **Wait 10 min** for DNS propagation
6. **Verify domain** in Resend (should show green checkmark)
7. **Create API key** (starts with `re_`)
8. **Copy and save** the API key

✅ **Check:** Domain shows "Verified" in Resend dashboard

---

### ⏱️ Step 4: Configure Secrets (3 min)

```bash
# Run the interactive setup script
./setup-secrets.sh

# Or manually:
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_key
supabase secrets set VITE_APP_URL=https://groundupcareers.app
supabase secrets set SUPABASE_URL=https://wzlqbrglftrkxrfztcqd.supabase.co
```

**Get Service Role Key:**
Go to: Settings → API → Service Role Key (not anon key!)
https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd/settings/api

✅ **Check:** Run `supabase secrets list` - should show 4 secrets

---

### ⏱️ Step 5: Deploy Edge Functions (5 min)

```bash
./deploy-functions.sh
```

This deploys 14 functions including:
- Email notifications (via Resend)
- Resume parsing (via Gemini AI)
- Stripe webhooks
- Client invitations

✅ **Check:** Visit [Functions](https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd/functions) - all 14 should be listed

---

### ⏱️ Step 6: Deploy to Vercel (7 min)

#### Option A: Vercel Dashboard (Recommended)

1. **Go to:** https://vercel.com/dashboard
2. **Click:** "New Project"
3. **Import:** `GustheTrader/GroundUp-Dashboard`
4. **Configure:**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add Environment Variables:**
   ```
   VITE_SUPABASE_URL=https://wzlqbrglftrkxrfztcqd.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci... (from .env file)
   VITE_SUPABASE_PROJECT_ID=byoaftebddfhtxhqrwju
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci... (from .env file)
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (from .env file)
   VITE_APP_URL=https://groundupcareers.app/
   VITE_GEMINI_API_KEY=your_gemini_key (optional)
   ```
6. **Click:** "Deploy"

#### Option B: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel link
vercel --prod
```

✅ **Check:** Visit your Vercel URL - app should load

---

## ✅ Verification (5 min)

Test everything works:

### 1. App Loads
Visit: https://groundupcareers.app (or your Vercel URL)
- [ ] No console errors
- [ ] All pages load

### 2. Authentication
- [ ] Sign up with email works
- [ ] Login works
- [ ] Redirects to dashboard

### 3. Database
- [ ] Can create/view clients
- [ ] Can upload resumes
- [ ] Data persists after refresh

### 4. Email
- [ ] Test email notification sent
- [ ] Check Resend dashboard shows email
- [ ] Email delivered successfully

### 5. Edge Functions
```bash
# Check function logs
supabase functions logs send-email-alert
```
- [ ] No errors in logs

---

## 🎉 You're Done!

Your GroundUp Dashboard is now live and fully functional!

**Access your app:**
- **Production:** https://groundupcareers.app
- **Supabase Dashboard:** https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd
- **Resend Dashboard:** https://resend.com/emails
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## 📚 Detailed Guides

For more information, see:
- **Full Deployment:** `DEPLOYMENT_CHECKLIST.md`
- **Vercel Setup:** `VERCEL_SETUP.md`
- **DNS Setup:** `DNS_SETUP_RESEND.md`
- **Initial Setup:** `SETUP_GUIDE.md`

---

## 🆘 Common Issues

### Emails not sending
```bash
# Check secrets
supabase secrets list

# Check function logs
supabase functions logs send-email-alert
```

### Build failing on Vercel
1. Check all environment variables are set
2. Test build locally: `npm run build`
3. Check Vercel build logs

### Database errors
1. Verify RLS policies in Supabase Dashboard
2. Check user has correct role in `profiles` table
3. Review migration logs

---

## 🔄 Continuous Deployment

Once set up, deployments are automatic:

**Database changes:**
```bash
# Create new migration
supabase migration new my_change

# Edit: supabase/migrations/[timestamp]_my_change.sql

# Deploy
./deploy-migrations.sh
```

**Function changes:**
```bash
# Edit: supabase/functions/[function-name]/index.ts

# Deploy
supabase functions deploy [function-name]
# OR
./deploy-functions.sh
```

**Frontend changes:**
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys!
```

---

## 📞 Need Help?

- **Documentation:** See all `.md` files in project root
- **Supabase Docs:** https://supabase.com/docs
- **Resend Docs:** https://resend.com/docs
- **Vercel Docs:** https://vercel.com/docs

**Stuck?** Review the troubleshooting sections in:
- `DEPLOYMENT_CHECKLIST.md`
- `VERCEL_SETUP.md`
- `SETUP_GUIDE.md`

---

## 🎯 Next Steps

After deployment:
1. **Configure email alerts** in admin dashboard
2. **Add your first client**
3. **Upload test resumes**
4. **Set up Stripe** for payments (if needed)
5. **Customize branding** (logo, colors)
6. **Invite team members**

**Happy deploying! 🚀**
