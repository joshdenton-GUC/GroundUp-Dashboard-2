# URGENT: Fix 404 Error on Email Confirmation Link

## Problem

Users receive the sign-up confirmation email, but when they click the confirmation link, they see a **404 error page** instead of being redirected to the dashboard.

## Root Cause

The confirmation callback URL (`https://groundupcareers.app/auth/callback`) is not whitelisted in your production Supabase project settings. Supabase rejects the authentication callback when the URL is not in the allowed list.

## Solution (5 Minutes)

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd
2. Log in if needed

### Step 2: Navigate to URL Configuration

**Option A (Recommended):**
- Click **Authentication** in left sidebar
- Click **URL Configuration** tab

**Option B:**
- Click the **gear icon** (Project Settings) in left sidebar
- Click **Auth** under Configuration section
- Scroll to **URL Configuration**

### Step 3: Configure Site URL

In the **Site URL** field, set:
```
https://groundupcareers.app
```

**Important:**
- ✅ Use `https://` (not `http://`)
- ✅ No trailing slash
- ❌ NOT `http://127.0.0.1:3000` (that's for local dev)

### Step 4: Add Redirect URLs

Click **"Add URL"** or in the **Redirect URLs** section, add these EXACT URLs one by one:

```
https://groundupcareers.app/auth/callback
https://groundupcareers.app/**
https://groundupcareers.app/*
```

After adding each URL, it should appear in a list below.

### Step 5: Save Changes

1. Click the **"Save"** button at the bottom
2. Wait for the confirmation message
3. Refresh the page to verify the URLs are saved

### Step 6: Test

1. Have a user request a NEW confirmation email (or sign up with a new test account)
2. Check the email inbox
3. Click the confirmation link
4. User should now be redirected to the dashboard successfully ✅

## What This Fixes

- ✅ 404 error when clicking confirmation links
- ✅ Proper redirect to dashboard after email confirmation
- ✅ Password reset links (uses same redirect mechanism)
- ✅ Magic link authentication (if used)

## Visual Guide

### Where to Find URL Configuration

**Screenshot Location 1:**
```
Supabase Dashboard
└── Authentication (left sidebar)
    └── URL Configuration (tab at top)
        ├── Site URL: [Enter production URL]
        └── Redirect URLs: [Add callback URLs]
```

**Screenshot Location 2:**
```
Supabase Dashboard
└── ⚙️ Project Settings (left sidebar)
    └── Auth (under Configuration)
        └── Scroll down to "URL Configuration"
```

## Common Mistakes to Avoid

### ❌ Wrong Site URL
```
http://127.0.0.1:3000  ← Local development URL
http://groundupcareers.app  ← Missing HTTPS
https://groundupcareers.app/  ← Has trailing slash
```

### ✅ Correct Site URL
```
https://groundupcareers.app
```

### ❌ Wrong Redirect URL
```
http://groundupcareers.app/auth/callback  ← HTTP instead of HTTPS
https://www.groundupcareers.app/auth/callback  ← Extra "www"
groundupcareers.app/auth/callback  ← Missing protocol
```

### ✅ Correct Redirect URLs
```
https://groundupcareers.app/auth/callback
https://groundupcareers.app/**
https://groundupcareers.app/*
```

## Verification

### 1. Check the Email Link

When a user receives a confirmation email, inspect the link (hover over it or view email source):

**Correct:**
```
https://groundupcareers.app/auth/callback?token_hash=...&type=signup
```

**Incorrect (means Site URL is wrong):**
```
http://127.0.0.1:3000/auth/callback?token_hash=...&type=signup
```

### 2. Check Supabase Auth Logs

1. Go to Supabase Dashboard
2. Click **Logs** → **Auth Logs**
3. Look for errors like:
   - "Invalid redirect URL"
   - "Redirect URL not whitelisted"
   - "CORS error"

### 3. Check Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Verify `VITE_APP_URL` is set to:
   ```
   https://groundupcareers.app
   ```
4. If you make changes, **redeploy** your application

## Still Not Working?

### Double-Check These Settings

1. **Site URL in Supabase:**
   - Must be: `https://groundupcareers.app`
   - No trailing slash
   - Uses HTTPS

2. **Redirect URLs in Supabase:**
   - All three variations added:
     - `https://groundupcareers.app/auth/callback`
     - `https://groundupcareers.app/**`
     - `https://groundupcareers.app/*`
   - Saved successfully

3. **VITE_APP_URL in Vercel:**
   - Set to: `https://groundupcareers.app`
   - Redeployed after changing

4. **Email Confirmations Enabled:**
   - Authentication → Email → "Enable email confirmations" = ON

### Advanced Debugging

If the issue persists:

1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Click the confirmation link
   - Check Console tab for errors
   - Check Network tab for failed requests

2. **Test with Incognito/Private Window:**
   - Sometimes cached auth state causes issues
   - Try clicking the link in an incognito window

3. **Request New Confirmation Email:**
   - Old confirmation links may have expired
   - Have user sign up again or request resend

4. **Check Supabase Status:**
   - Visit: https://status.supabase.com
   - Verify no ongoing outages

## Technical Details

### Why This Happens

For security reasons, Supabase requires all authentication callback URLs to be explicitly whitelisted. This prevents:
- Phishing attacks
- Open redirect vulnerabilities
- Unauthorized access

The redirect URL must match exactly (protocol, domain, path) or match a wildcard pattern.

### The Flow

1. User signs up → Supabase creates pending account
2. Supabase sends email with link: `https://groundupcareers.app/auth/callback?token_hash=xyz&type=signup`
3. User clicks link → Request goes to your app
4. Your app's Vercel rewrites route all requests to `index.html`
5. React Router matches `/auth/callback` → Loads `AuthCallbackPage`
6. `AuthCallbackPage` extracts token from URL → Calls Supabase to confirm
7. Supabase checks if redirect URL is whitelisted:
   - ✅ If whitelisted: Confirms email, logs in user
   - ❌ If not whitelisted: Returns 404 or error
8. User is redirected to dashboard

### Files Involved

- **Route Definition:** `src/App.tsx:43` - Defines `/auth/callback` route
- **Callback Handler:** `src/pages/auth/AuthCallbackPage.tsx` - Processes confirmation
- **Vercel Rewrites:** `vercel.json:5-9` - SPA routing (already correct ✅)
- **Auth Context:** `src/contexts/AuthContext.tsx:171-172` - Generates redirect URL

All code is correct ✅ - Only the Supabase dashboard configuration needs updating.

## Summary Checklist

After following this guide, verify:

- [ ] Site URL set to `https://groundupcareers.app` (no trailing slash)
- [ ] Three redirect URLs added to Supabase
- [ ] Changes saved in Supabase Dashboard
- [ ] VITE_APP_URL set correctly in Vercel (optional double-check)
- [ ] New confirmation email sent to test user
- [ ] Test user clicks link and successfully reaches dashboard
- [ ] No 404 error

## Questions?

If you're still experiencing issues after following this guide:

1. Review the full documentation: `SUPABASE_EMAIL_SETUP.md`
2. Check Supabase Auth Logs for specific error messages
3. Verify all environment variables are set correctly
4. Contact Supabase support if the issue persists

---

**Last Updated:** 2025-11-10
**Author:** Claude Code
**Related Docs:** SUPABASE_EMAIL_SETUP.md
