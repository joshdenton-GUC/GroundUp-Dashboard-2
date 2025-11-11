# How to Fix Reset Password Email in Supabase

## Quick Instructions

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **GroundUp-Dashboard-2**
3. Click **Authentication** (left sidebar)
4. Click **Email Templates** (sub-menu)

### Step 2: Select the Recovery Template
1. Look for the template called **"Reset Password"** or **"Recovery"**
2. Click to edit it

### Step 3: Update the Template

#### Subject Line:
```
Reset Your Password at GroundUp Careers! 🔑
```

#### Message Body:
Copy the entire contents of the file `supabase-reset-password-template.html` and paste it into the "Message (Body)" field in Supabase.

**Important**: Make sure you copy the ENTIRE file including the `<!DOCTYPE html>` at the top.

### Step 4: Key Points to Verify

✅ **The reset link MUST use this exact variable**: `{{ .ConfirmationURL }}`

This is Supabase's special variable that contains the complete reset password URL with the security token.

### Step 5: Configure Redirect URL

In the Email Templates section, make sure the **Redirect URL** or **Site URL** is set to:

**Production:**
```
https://groundupcareers.com/reset-password
```

**Development/Local:**
```
http://127.0.0.1:3000/reset-password
```

This tells Supabase where to send users after they click the reset link.

### Step 6: Test the Flow

1. Go to your login page: `/auth`
2. Click **"Forgot your password?"**
3. Enter your email address
4. Click **"Send reset link"**
5. Check your email inbox (and spam folder!)
6. You should receive the new branded email with an **active** reset link
7. Click **"Reset Your Password"** button
8. Verify you're redirected to the reset password page
9. Enter a new password
10. Confirm you can log in with the new password

---

## Troubleshooting

### Problem: Link still doesn't work
**Solution**: Make sure you're using `{{ .ConfirmationURL }}` (with double curly braces and a dot before the C)

### Problem: Email doesn't arrive
**Solution**:
1. Check your spam folder
2. Verify SMTP settings in Supabase (Project Settings → Auth → SMTP)
3. Make sure the sender email is verified

### Problem: Link expired error
**Solution**: The reset link expires after 1 hour. Request a new one.

### Problem: Wrong page after clicking link
**Solution**: Check the Site URL in Supabase Auth settings matches your domain

---

## Supabase Template Variables Reference

Use these variables in your email templates:

- `{{ .ConfirmationURL }}` - **Complete reset URL** (use this for reset button)
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your site URL (from Supabase settings)
- `{{ .Token }}` - Raw token (not recommended to use)
- `{{ .TokenHash }}` - Token hash (not recommended to use)

**Always use `{{ .ConfirmationURL }}`** for password reset links - it's secure and includes all necessary parameters.

---

## Files in This Repository

- **supabase-reset-password-template.html** - The complete HTML template (copy this into Supabase)
- **FIX_RESET_PASSWORD_EMAIL.md** - Detailed troubleshooting guide
- **This file** - Quick setup instructions

---

**Need Help?**
Contact Supabase support with your project ID: `wzlqbrglftrkxrfztcqd`
