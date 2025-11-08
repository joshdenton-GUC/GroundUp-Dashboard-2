# 🚀 QUICK FIX DEPLOYMENT GUIDE

## Your Supabase Project
- **Project ID**: `vpvvcwvebjtibafsceqx`
- **Dashboard**: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx

---

## ⚡ FASTEST METHOD - Apply SQL Directly (5 minutes)

### Step 1: Open SQL Editor
Go to: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/sql

### Step 2: Run This SQL

Copy and paste the following SQL into the editor and click **RUN**:

```sql
-- =============================================================================
-- FIX PROFILE AND CLIENT CREATION ON SIGNUP
-- =============================================================================

-- Drop and recreate the handle_new_user function with correct implementation
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_name TEXT;
  v_contact_phone TEXT;
  v_street1 TEXT;
  v_street2 TEXT;
  v_city TEXT;
  v_state TEXT;
  v_zip TEXT;
  v_user_id TEXT;
  v_profile_count INTEGER;
BEGIN
  -- Get the current count of profiles to generate the next user ID
  SELECT COUNT(*) + 1 INTO v_profile_count FROM public.profiles;

  -- Generate the user ID in format "User_XX" where XX is zero-padded
  v_user_id := 'User_' || LPAD(v_profile_count::TEXT, 2, '0');

  -- Insert profile record with generated user ID
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    v_user_id,
    'client'
  );

  -- Extract company information from user metadata
  v_company_name := NEW.raw_user_meta_data ->> 'company_name';
  v_contact_phone := NEW.raw_user_meta_data ->> 'contact_phone';
  v_street1 := NEW.raw_user_meta_data ->> 'street1';
  v_street2 := NEW.raw_user_meta_data ->> 'street2';
  v_city := NEW.raw_user_meta_data ->> 'city';
  v_state := NEW.raw_user_meta_data ->> 'state';
  v_zip := NEW.raw_user_meta_data ->> 'zip';

  -- Create client record if company name is provided
  IF v_company_name IS NOT NULL AND v_company_name != '' THEN
    INSERT INTO public.clients (
      user_id,
      company_name,
      contact_phone,
      street1,
      street2,
      city,
      state,
      zip
    )
    VALUES (
      NEW.id,
      v_company_name,
      v_contact_phone,
      v_street1,
      v_street2,
      v_city,
      v_state,
      v_zip
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment to document the fix
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile and client records on user signup. Fixed to ensure proper profile creation.';
```

### Step 3: Verify Success
You should see: **Success. No rows returned**

---

## ✅ VERIFY THE FIX

### Check the Trigger Function Exists

Run this query in the SQL Editor:

```sql
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'handle_new_user';
```

You should see the function definition with both profile AND client insertion logic.

### Test Sign-Up Flow

1. Go to your app: https://groundupcareers.app/
2. Create a new test user account
3. Complete email verification
4. Check if you can log in and access the dashboard

### Check Database Records

After testing signup, verify records were created:

```sql
-- Check the most recent profile
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;

-- Check the most recent client
SELECT * FROM clients ORDER BY created_at DESC LIMIT 1;
```

---

## 🔧 ALTERNATIVE METHOD - Using Supabase CLI

If you prefer using the CLI:

### Step 1: Install Supabase CLI (if not already installed)

**macOS/Linux:**
```bash
npm install -g supabase
```

**Windows:**
```powershell
npm install -g supabase
```

### Step 2: Link to Your Project

```bash
supabase link --project-ref vpvvcwvebjtibafsceqx
```

Enter your database password when prompted.

### Step 3: Push Migrations

```bash
supabase db push
```

This will apply all pending migrations including the profile signup fix.

---

## 📊 CHECK FOR AFFECTED USERS

If users signed up during the bug period, they may be missing client records:

```sql
-- Find users with profiles but no client records
SELECT
  p.user_id,
  p.email,
  p.full_name,
  p.created_at
FROM profiles p
LEFT JOIN clients c ON c.user_id = p.user_id
WHERE c.id IS NULL
  AND p.role = 'client'
ORDER BY p.created_at DESC;
```

If you find any, you can manually create client records for them:

```sql
-- Replace USER_ID_HERE with actual user_id from above query
INSERT INTO clients (user_id, company_name)
VALUES ('USER_ID_HERE', 'Company Name Here');
```

---

## 🎯 NEXT STEPS AFTER APPLYING FIX

1. ✅ Test signup flow with a new user
2. ✅ Verify job posting works
3. ✅ Test Stripe payment integration
4. ✅ Check that all app features are functional

---

## 🆘 TROUBLESHOOTING

### Issue: SQL returns an error

**Solution**: Check if the `clients` table has all required columns:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clients'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

Required columns:
- id
- user_id
- company_name
- contact_phone
- street1, street2, city, state, zip
- created_at, updated_at

### Issue: Trigger doesn't fire

**Solution**: Check if trigger exists:

```sql
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgfoid::regproc as function_name
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

### Issue: New users still can't sign up

**Solution**:
1. Check browser console for errors
2. Verify .env file has correct Supabase URL and keys
3. Check if RLS policies are enabled on profiles and clients tables

---

## 📝 WHAT WAS FIXED

**Problem**: Database trigger was overwritten by a conflicting migration, breaking profile and client creation on signup.

**Solution**: Recreated the `handle_new_user()` trigger function to:
- Create profile records with role='client'
- Extract company data from signup form metadata
- Create client records with all address fields
- Generate sequential user IDs (User_01, User_02, etc.)

---

## 🔗 USEFUL LINKS

- SQL Editor: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/sql
- Table Editor: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/editor
- Auth Users: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/auth/users
- Logs: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/logs

---

**Need help?** Check `PROFILE_SIGNUP_FIX.md` for detailed technical explanation.
