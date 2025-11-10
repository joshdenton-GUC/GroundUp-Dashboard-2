# Admin Setup and User Management Guide

## Understanding the User Data Structure

When you look at your Supabase database, user information is stored in **three different places**. Here's how they work together:

### 1. `auth.users` Table (Supabase Authentication)

This is Supabase's internal authentication table where **ALL users start**.

**Location:** Supabase Dashboard → Authentication → Users

**What it stores:**
- `id`: Unique user ID (UUID)
- `email`: User's email address
- `encrypted_password`: Hashed password (secure)
- `email_confirmed_at`: When email was confirmed
- `raw_user_meta_data`: Extra info from sign-up (company name, phone, address)
- `created_at`: When account was created

**This is the "users section" you're referring to!**

### 2. `profiles` Table (Application Data)

Your application's table that extends the auth.users data.

**Location:** Supabase Dashboard → Table Editor → public → profiles

**What it stores:**
- `user_id`: Links to auth.users.id
- `email`: Copy of email for easy access
- `full_name`: Auto-generated (User_01, User_02) or custom
- `role`: **'admin', 'client', or 'user'** ← This determines permissions!
- `is_active`: Whether account is enabled
- `created_at` and `updated_at`: Timestamps

**This is where the role (admin vs client) is stored!**

### 3. `clients` Table (Client-Specific Data)

Only for users with `role = 'client'`.

**Location:** Supabase Dashboard → Table Editor → public → clients

**What it stores:**
- `user_id`: Links to profiles.user_id
- `company_name`: Client's company
- `contact_phone`: Phone number
- `street1, street2, city, state, zip`: Address fields
- `created_at` and `updated_at`: Timestamps

---

## How They Work Together

When a user signs up:

```
1. User fills sign-up form
   ↓
2. Created in auth.users (with password)
   ↓
3. Trigger creates profile in profiles table (role = 'client')
   ↓
4. Trigger creates client record in clients table (if company info provided)
```

When you view a user:
- **auth.users** shows the authentication account
- **profiles** shows their role (admin/client)
- **clients** shows their company details (only for clients)

---

## Setting Up Admin Users

There are **two ways** to create admin users:

### Method 1: Manually in Supabase Dashboard (Recommended for First Admin)

#### Step 1: Go to Supabase Dashboard

1. Open https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd
2. Click **Table Editor** in the left sidebar
3. Select **profiles** table

#### Step 2: Find the User

Look for the user you want to make an admin. You can search by email.

#### Step 3: Change the Role

1. Click on the row for that user
2. Find the `role` column
3. Change it from `'client'` or `'user'` to **`'admin'`**
4. Click **Save** or press Enter

**That's it!** The user is now an admin.

#### Step 4: Verify

1. Have the user log out and log back in
2. They should now see the admin dashboard
3. Check **Authentication → Users** to confirm

---

### Method 2: Using SQL (For Multiple Admins)

You can run SQL commands to create or promote users to admin.

#### Make an Existing User an Admin

```sql
-- Find user by email and make them admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

#### Check Who Are Admins

```sql
-- List all admin users
SELECT
  p.email,
  p.full_name,
  p.role,
  p.is_active,
  u.email_confirmed_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE p.role = 'admin';
```

#### Create a New Admin User (Complex)

```sql
-- Note: You can't directly create in auth.users via SQL
-- Instead, use Supabase Dashboard → Authentication → Invite User
-- Then run this after they sign up:

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'newadmin@example.com';
```

---

## Setting Up Admin Passwords

### For New Admins

#### Option 1: Admin Signs Up Normally

1. Admin goes to your app: https://groundupcareers.app/auth
2. Clicks **Sign Up**
3. Fills out the form with their information
4. Confirms email
5. You (as super admin) change their role to 'admin' in Supabase Dashboard

**Then they can sign in with their password!**

#### Option 2: Invite Admin User (Recommended)

Supabase has an invite feature:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **"Invite user"** button
3. Enter admin's email address
4. They receive an invitation email
5. They click link and set their password
6. You change their role to 'admin' in profiles table
7. They log in with their email and password

---

### For Existing Admins (Password Reset)

#### If Admin Forgot Password

The admin can reset their password themselves:

1. Go to: https://groundupcareers.app/auth
2. Click **"Forgot password?"**
3. Enter their email
4. Check email inbox for reset link
5. Click link → Redirects to Reset Password page
6. Enter new password
7. Click **"Update Password"**
8. Sign in with new password

#### If You Need to Reset for Them

As a super admin, you can send a reset link:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find the admin user
3. Click the **"..."** menu (three dots)
4. Select **"Send password recovery email"**
5. User receives email with reset link
6. They follow the link to set a new password

#### Manually Set Password via Dashboard

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find the user
3. Click on their email to open details
4. Look for **"Send magic link"** or **"Reset password"** options
5. Follow the workflow

---

## Password Management System

Your application has these password-related pages:

### 1. `/auth` - Sign In / Sign Up Page
- Users can sign in with email/password
- Users can sign up with company info
- "Forgot password?" link for resets

**File:** `src/pages/auth/AuthPage.tsx`

### 2. `/reset-password` - Reset Password Page
- Accessed via email link from "Forgot password?"
- User enters new password twice
- Validates password strength (min 6 characters)
- Updates password in Supabase

**File:** `src/pages/auth/ResetPasswordPage.tsx`

### 3. `/auth/set-password` - Set Password (For Invites)
- Used when admin invites a user
- Strong password requirements:
  - At least 8 characters
  - One uppercase letter
  - One lowercase letter
  - One number
  - One special character
- User sets password for first time

**File:** `src/pages/auth/SetPasswordPage.tsx`

---

## Admin Control Features

### What Admins Can Do

Admins have access to:

1. **View All Users**
   - See all profiles in the system
   - Access via RLS policy: "Admins can view all profiles"

2. **View All Clients**
   - See all client companies
   - Access company info and contact details
   - Access via RLS policy: "Admins can view all clients"

3. **Manage Candidates**
   - Upload candidates
   - Assign candidates to clients
   - Review applications

4. **View Analytics Dashboard**
   - Admin-only dashboard at `/dashboard`
   - See system-wide statistics

5. **Deactivate Users** (if implemented)
   - Set `is_active = false` in profiles table

### Admin Routes

**Admin Dashboard:** `/dashboard` (protected by AdminProtectedRoute)

**File:** `src/App.tsx:47-55`

```typescript
<Route
  path="/dashboard"
  element={
    <AdminProtectedRoute>
      <DashboardLayout />
    </AdminProtectedRoute>
  }
>
  <Route index element={<DashboardHome />} />
</Route>
```

---

## Creating Your First Admin

If you don't have any admin users yet:

### Quick Setup

1. **Sign up a user normally** on your app
2. **Go to Supabase Dashboard**
3. **Table Editor** → **profiles**
4. **Find the user** by email
5. **Change role** from `'client'` to `'admin'`
6. **Save**

### Automatic First Admin

There's a migration that makes the first user an admin automatically:

**File:** `supabase/migrations/20250120000024_ensure_admin_role.sql`

```sql
-- If no admin exists, set the first user as admin
IF admin_count = 0 THEN
  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);
END IF;
```

This runs automatically when you deploy migrations.

---

## Troubleshooting

### Admin Can't Access Dashboard

**Check:**
1. User's `role` in profiles table is `'admin'`
2. User has confirmed their email (`email_confirmed_at` is not null)
3. User's `is_active` is `true`
4. User logged out and back in after role change

**Fix:**
```sql
-- Verify admin role
SELECT email, role, is_active FROM public.profiles WHERE email = 'admin@example.com';

-- Make sure they're admin
UPDATE public.profiles SET role = 'admin', is_active = true WHERE email = 'admin@example.com';
```

### Password Reset Not Working

**Check:**
1. Email confirmations are enabled in Supabase Dashboard
2. Site URL is correct: `https://groundupcareers.app`
3. Redirect URLs include: `https://groundupcareers.app/reset-password`

**Fix:** See `SUPABASE_EMAIL_SETUP.md` for email configuration.

### Can't Create New Admins

**Check:**
1. User exists in auth.users first
2. Profile was created by trigger
3. You have permission to update profiles table

**Fix:**
```sql
-- Check if profile exists
SELECT * FROM public.profiles WHERE email = 'newadmin@example.com';

-- If profile exists, make them admin
UPDATE public.profiles SET role = 'admin' WHERE email = 'newadmin@example.com';
```

---

## SQL Queries for Admin Management

### List All Admins

```sql
SELECT
  u.email,
  u.created_at as signed_up,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.is_active
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
WHERE p.role = 'admin'
ORDER BY u.created_at;
```

### List All Users with Roles

```sql
SELECT
  u.email,
  p.role,
  p.is_active,
  c.company_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.clients c ON c.user_id = u.id
ORDER BY u.created_at DESC;
```

### Make Multiple Users Admin

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
);
```

### Deactivate a User

```sql
UPDATE public.profiles
SET is_active = false
WHERE email = 'user@example.com';
```

### Reactivate a User

```sql
UPDATE public.profiles
SET is_active = true
WHERE email = 'user@example.com';
```

---

## Summary

### User Data Structure:
- **auth.users** = Authentication account with password
- **profiles** = Application user with role (admin/client)
- **clients** = Client-specific data (company, address)

### Creating Admin:
1. User signs up or gets invited
2. You change their role to 'admin' in profiles table
3. They log out and back in
4. Now they have admin access

### Password Management:
- **Sign Up:** User creates password during registration
- **Forgot Password:** User requests reset link → sets new password
- **Admin Invite:** User clicks invite link → sets password for first time
- **Admin Reset:** You send recovery email → user sets new password

### Key Files:
- Admin role management: `supabase/migrations/20250120000024_ensure_admin_role.sql`
- Auth pages: `src/pages/auth/AuthPage.tsx`
- Password reset: `src/pages/auth/ResetPasswordPage.tsx`
- Set password: `src/pages/auth/SetPasswordPage.tsx`
- Admin routes: `src/App.tsx`

---

## Need More Help?

See these related guides:
- **SUPABASE_EMAIL_SETUP.md** - Email configuration
- **FIX_404_CONFIRMATION_LINK.md** - Fix confirmation link issues
- **SIGNUP_DATA_NOT_SAVING.md** - Troubleshoot data saving

Or check your Supabase Dashboard logs for detailed error messages.
