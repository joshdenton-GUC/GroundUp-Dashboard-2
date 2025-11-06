# ☁️ Vercel Deployment Guide for GroundUp Dashboard

This guide will walk you through deploying your GroundUp Dashboard to Vercel.

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Completed Supabase setup (migrations and functions deployed)
- [ ] Resend domain verified and API key obtained
- [ ] GitHub repository pushed with latest code
- [ ] Vercel account created (https://vercel.com)

---

## 🚀 Deployment Methods

### Method 1: Vercel Dashboard (Recommended for First Deploy)

#### Step 1: Create New Project

1. **Go to:** https://vercel.com/dashboard
2. **Click:** "Add New..." → "Project"
3. **Import** your GitHub repository:
   - Repository: `GustheTrader/GroundUp-Dashboard`
   - Click "Import"

#### Step 2: Configure Build Settings

**Framework Preset:** Vite

**Build & Development Settings:**
```
Build Command:         npm run build
Output Directory:      dist
Install Command:       npm install
Development Command:   npm run dev
```

**Root Directory:** `./` (leave as default)

#### Step 3: Add Environment Variables

Click **"Environment Variables"** and add the following:

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

# Gemini AI (Optional - for AI resume parsing)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Important Settings:**
- For each variable, select: **Production**, **Preview**, and **Development**
- Click "Add" after each variable

#### Step 4: Deploy

1. **Click:** "Deploy"
2. **Wait** for the build to complete (2-5 minutes)
3. **View** your deployment at the provided URL (e.g., `groundup-dashboard.vercel.app`)

---

### Method 2: Vercel CLI (For Advanced Users)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

This will open a browser for authentication.

#### Step 3: Link Your Project

```bash
# From your project root
cd /path/to/GroundUp-Dashboard

# Link to Vercel
vercel link
```

Follow the prompts:
- Set up and deploy? **No** (we'll configure first)
- Link to existing project? **Yes** (if you created one) or **No** (to create new)
- What's your project's name? `groundup-dashboard`
- In which directory is your code located? `./`

#### Step 4: Set Environment Variables

**Option A: Via CLI**
```bash
# Supabase
vercel env add VITE_SUPABASE_URL production
# Paste: https://wzlqbrglftrkxrfztcqd.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel env add VITE_SUPABASE_PROJECT_ID production
# Paste: byoaftebddfhtxhqrwju

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
# Paste: pk_live_51R7rIRDAcCu9dUuDqShaD4Ol97RL4QwmMoohvAa6qypo1SNRhb4bDYSCpxjdCuZtcLYWggb4lVTOJ7YaF7HpP8fJ008xxS2HCP

# App
vercel env add VITE_APP_URL production
# Paste: https://groundupcareers.app/

# Gemini (Optional)
vercel env add VITE_GEMINI_API_KEY production
# Paste: your_gemini_api_key
```

**Option B: Via .env File**
```bash
# Pull remote env vars
vercel env pull .env.production

# Edit the file
nano .env.production

# Push back to Vercel
vercel env push .env.production production
```

#### Step 5: Deploy

```bash
# Deploy to production
vercel --prod
```

---

## 🌐 Custom Domain Setup

### Step 1: Add Domain in Vercel

1. **Go to:** Project Settings → Domains
2. **Click:** "Add Domain"
3. **Enter:** `groundupcareers.app`
4. **Click:** "Add"

### Step 2: Configure DNS

Vercel will provide DNS records. Add them to your domain registrar:

**Option A: CNAME (Recommended)**
```
Type:   CNAME
Name:   @  (or www)
Value:  cname.vercel-dns.com
TTL:    3600
```

**Option B: A Record**
```
Type:   A
Name:   @
Value:  76.76.21.21  (Vercel's IP)
TTL:    3600
```

**For www subdomain:**
```
Type:   CNAME
Name:   www
Value:  cname.vercel-dns.com
TTL:    3600
```

### Step 3: Verify Domain

1. Wait 10-60 minutes for DNS propagation
2. Check status in Vercel Dashboard
3. Once verified, Vercel will automatically issue SSL certificate

---

## 🔧 Vercel Configuration File

Your project already has a `vercel.json` file:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This configures:
- Build command
- Output directory for static files
- SPA routing (all routes redirect to index.html)

---

## 🔄 Automatic Deployments

### Git Integration

Vercel automatically deploys when you push to GitHub:

**Production Deployments:**
- Triggered by: Push to `main` or `master` branch
- URL: Your custom domain (e.g., `groundupcareers.app`)

**Preview Deployments:**
- Triggered by: Push to any other branch or Pull Request
- URL: Auto-generated preview URL (e.g., `groundup-dashboard-git-feature-yourusername.vercel.app`)

### Manual Deployment

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

---

## 📊 Post-Deployment Checks

### 1. Verify Deployment

Visit your deployment URL and check:

- [ ] App loads without errors
- [ ] No console errors (F12 → Console)
- [ ] All environment variables loaded correctly
- [ ] Authentication works (sign up/login)
- [ ] Database operations work

### 2. Check Build Logs

If deployment fails:

1. **Go to:** Vercel Dashboard → Your Project → Deployments
2. **Click** on the failed deployment
3. **View** the build logs
4. **Common issues:**
   - Missing environment variables
   - TypeScript errors
   - Build command issues

### 3. Test Performance

Vercel provides analytics:

1. **Go to:** Project → Analytics
2. **Check:**
   - Page load times
   - Core Web Vitals
   - Traffic patterns

---

## 🐛 Troubleshooting

### Issue: Build Failed

**Solution 1: Check Build Logs**
```bash
# View logs in terminal
vercel logs [deployment-url]
```

**Solution 2: Test Build Locally**
```bash
npm run build
```

**Solution 3: Verify Environment Variables**
- Go to: Project Settings → Environment Variables
- Ensure all VITE_* variables are set
- Redeploy after adding variables

---

### Issue: Environment Variables Not Working

**Solution:**
1. Verify variables are set for correct environment (Production, Preview, Dev)
2. Ensure variable names start with `VITE_` (required by Vite)
3. Redeploy after adding/changing variables:
   ```bash
   vercel --prod --force
   ```

---

### Issue: 404 on Page Refresh

**Solution:**
Ensure `vercel.json` has the rewrite rule:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This is already configured in your project.

---

### Issue: CORS Errors

**Solution:**
1. Check Supabase Auth settings:
   - Go to: Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL to "Site URL" and "Redirect URLs"
   ```
   https://groundupcareers.app
   https://groundup-dashboard.vercel.app
   ```

2. Update `VITE_APP_URL` environment variable to match your domain

---

### Issue: Slow Build Times

**Solution:**
1. Enable caching in `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci --prefer-offline --no-audit"
}
```

2. Check for large dependencies
3. Consider using `npm ci` instead of `npm install`

---

## 📈 Monitoring & Analytics

### Vercel Analytics

Enable analytics to track:
- Page views
- Performance metrics
- User geography
- Referrers

**To enable:**
1. Go to: Project Settings → Analytics
2. Click "Enable"
3. Install package (if needed):
   ```bash
   npm install @vercel/analytics
   ```

### Error Monitoring

Consider integrating:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Vercel Logs** for runtime logs

---

## 🔐 Security Best Practices

### 1. Environment Variables

✅ **Do:**
- Use Vercel's environment variables (encrypted at rest)
- Prefix client-side vars with `VITE_`
- Rotate secrets regularly

❌ **Don't:**
- Commit `.env` files to Git
- Expose service role keys to client
- Use same keys for dev/prod

### 2. Authentication

- All Supabase RLS policies enabled
- JWT verification on edge functions
- Secure password policies

### 3. CORS Configuration

- Whitelist specific domains only
- Don't use `*` in production
- Configure in Supabase Auth settings

---

## 📚 Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html
- **Supabase + Vercel:** https://supabase.com/docs/guides/platform/vercel
- **Custom Domains:** https://vercel.com/docs/concepts/projects/domains

---

## ✅ Deployment Checklist

Before marking complete:

- [ ] Vercel project created and linked
- [ ] All environment variables added
- [ ] Build successful
- [ ] Deployment accessible at Vercel URL
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate issued
- [ ] Authentication working
- [ ] Database connection working
- [ ] Email sending working
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Git auto-deploy configured

---

## 🎯 Quick Commands

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs [deployment-url]

# List environment variables
vercel env ls

# Pull environment variables
vercel env pull

# Remove deployment
vercel remove [deployment-url]

# List all deployments
vercel ls
```

---

**🎉 Success!** Your GroundUp Dashboard is now live on Vercel!

Visit your site and test all functionality. If you encounter any issues, refer to the troubleshooting section above.
