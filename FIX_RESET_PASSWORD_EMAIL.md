# Fix: Reset Password Email Issue

## Problem
When users click "Forgot Password" and request a password reset, they receive a "New Client Registration" email instead of the proper password reset email.

## Root Cause
The Supabase Email Templates in the Supabase Dashboard are not properly configured. The "Recovery" email template is either:
1. Not set up
2. Using the wrong template
3. Or there's an SMTP configuration issue

## Solution

### Step 1: Access Supabase Email Templates
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `GroundUp-Dashboard-2`
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure the Recovery Email Template
Look for the **"Reset Password"** or **"Recovery"** email template and configure it with:

#### Subject Line:
```
Reset your password - Ground Up Careers
```

#### Email Body (HTML):
```html
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background-color: #f97316;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #f97316;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We received a request to reset your password for your Ground Up Careers account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #3b82f6;">{{ .ConfirmationURL }}</p>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      <p style="margin-top: 30px;">
        Best regards,<br>
        Ground Up Careers Team
      </p>
    </div>
    <div class="footer">
      <p>© 2025 Ground Up Careers. All rights reserved.</p>
      <p>If you have any questions, please contact us at support@groundupcareers.com</p>
    </div>
  </div>
</body>
</html>
```

### Step 3: Verify the Redirect URL
In the same Email Templates section, make sure the **Redirect URL** is set correctly:

**For Production:**
```
{{ .SiteURL }}/reset-password
```

This should resolve to: `https://groundupcareers.com/reset-password`

**For Development:**
```
{{ .SiteURL }}/reset-password
```

This should resolve to: `http://127.0.0.1:3000/reset-password`

### Step 4: Check SMTP Configuration (If Using Custom Email Service)
If you're using a custom SMTP provider (like Resend):

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Verify that:
   - SMTP Host is correct
   - SMTP Port is correct (usually 587 for TLS)
   - Username and password are set
   - **Sender email** matches your verified domain
   - **Sender name** is set to "Ground Up Careers"

### Step 5: Test the Fix
1. Go to your auth page: `/auth`
2. Click "Forgot your password?"
3. Enter a test email address (your own)
4. Click "Send reset link"
5. Check your email inbox (and spam folder)
6. Verify you receive the **Reset Password** email (not the "New Client Registration" email)
7. Click the reset link
8. Verify you're redirected to `/reset-password`
9. Enter a new password and submit
10. Verify you can log in with the new password

## Technical Details

### Code Flow
1. User clicks "Forgot password?" button → `AuthPage.tsx:598`
2. User enters email and clicks "Send reset link" → `AuthPage.tsx:528`
3. Calls `handleForgotPassword()` → `AuthPage.tsx:289`
4. Calls `resetPassword(email)` from AuthContext → `AuthPage.tsx:294`
5. Calls `supabase.auth.resetPasswordForEmail()` → `AuthContext.tsx:370`
6. Supabase sends the **Recovery** email template

### Why This Happened
The "New Client Registration" email is triggered by the `notify-new-client` Edge Function when a new client signs up. However, this should NEVER be triggered during password reset.

The fact that you received this email means Supabase is either:
1. Using the wrong email template for recovery
2. Or there's a misconfiguration in the email template selection

## Additional Notes

### Email Template Variables
Supabase provides these variables for the Recovery email template:
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Recovery token (not recommended to use directly)
- `{{ .TokenHash }}` - Hashed token (not recommended to use directly)
- `{{ .ConfirmationURL }}` - Complete URL with token (recommended)
- `{{ .SiteURL }}` - Your site URL

### Recovery Link Expiration
By default, Supabase recovery links expire after **1 hour**. This is configured in:
- **Supabase Dashboard** → **Authentication** → **Settings** → **Auth Providers**
- Look for "JWT Expiry" or "Recovery Token Expiry"

### Current Configuration
Your `supabase/config.toml` shows:
```toml
[auth]
site_url = "http://127.0.0.1:3000"
jwt_expiry = 3600  # 1 hour
```

For production, make sure to update the `site_url` to your production domain.

## Checklist
- [ ] Access Supabase Dashboard Email Templates
- [ ] Find and update "Recovery" email template
- [ ] Verify subject line
- [ ] Update email HTML body
- [ ] Check redirect URL configuration
- [ ] Verify SMTP settings (if using custom email)
- [ ] Test password reset flow
- [ ] Verify correct email is received
- [ ] Test the reset link works
- [ ] Verify can log in with new password

## If Issue Persists

If you still receive the wrong email after updating the template:

1. **Check for database triggers**: Run this SQL query in your Supabase SQL Editor:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%auth%' OR tgname LIKE '%email%';
   ```

2. **Check Edge Function webhooks**: Verify no webhooks are listening to auth.users events:
   - Go to **Database** → **Webhooks**
   - Look for any webhooks on `auth.users` table

3. **Clear Supabase cache**: Sometimes Supabase caches email templates
   - Try toggling the email template off and back on
   - Or make a small edit to the template to force a refresh

4. **Contact Supabase Support**: If nothing works, contact Supabase support with:
   - Project ID: `wzlqbrglftrkxrfztcqd`
   - Issue: "Password recovery email sending wrong template"
   - Expected: Password reset email
   - Actual: New Client Registration email

## Related Files
- `src/contexts/AuthContext.tsx:366-374` - Reset password function
- `src/pages/auth/AuthPage.tsx:289-350` - Password reset UI
- `src/pages/auth/ResetPasswordPage.tsx` - Reset password form
- `src/pages/auth/AuthCallbackPage.tsx:13-23` - Recovery flow detection
- `supabase/functions/notify-new-client/` - Client registration email (should NOT trigger on password reset)

---

**Last Updated**: 2025-11-11
**Status**: Requires Supabase Dashboard configuration
