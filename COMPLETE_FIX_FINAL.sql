-- =============================================================================
-- COMPLETE FIX FOR PROFILE SIGNUP ISSUE (WITH SCHEMA FIX)
-- =============================================================================
-- This script:
-- 1. Ensures all required columns exist in clients table
-- 2. Fixes the trigger for future signups
-- 3. Backfills missing client records for existing users
-- 4. Verifies everything worked
--
-- RUN THIS IN: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/sql
-- =============================================================================

-- PART 0: ENSURE CLIENTS TABLE HAS ALL REQUIRED COLUMNS
-- =============================================================================

-- Add contact_phone if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'contact_phone'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN contact_phone TEXT;
    END IF;
END $$;

-- Add contact_email if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'contact_email'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN contact_email TEXT;
    END IF;
END $$;

-- Add street1 if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'street1'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN street1 TEXT;
    END IF;
END $$;

-- Add street2 if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'street2'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN street2 TEXT;
    END IF;
END $$;

-- Add city if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'city'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN city TEXT;
    END IF;
END $$;

-- Add state if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'state'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN state TEXT;
    END IF;
END $$;

-- Add zip if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'zip'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN zip TEXT;
    END IF;
END $$;

-- Add welcome_email_sent if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'welcome_email_sent'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN welcome_email_sent BOOLEAN DEFAULT false;
    END IF;
END $$;


-- =============================================================================
-- PART 1: FIX THE TRIGGER FOR FUTURE SIGNUPS
-- =============================================================================

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

  -- Generate the user ID in format "User_XX"
  v_user_id := 'User_' || LPAD(v_profile_count::TEXT, 2, '0');

  -- Insert profile record
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (NEW.id, NEW.email, v_user_id, 'client');

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
      user_id, company_name, contact_phone,
      street1, street2, city, state, zip
    )
    VALUES (
      NEW.id, v_company_name, v_contact_phone,
      v_street1, v_street2, v_city, v_state, v_zip
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

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile and client records on user signup. Fixed to ensure proper profile creation.';


-- =============================================================================
-- PART 2: BACKFILL MISSING CLIENT RECORDS FOR EXISTING USERS
-- =============================================================================

-- Create client records for existing profiles that don't have them
INSERT INTO public.clients (user_id, company_name, contact_phone, contact_email)
SELECT
  p.user_id,
  COALESCE(
    (SELECT raw_user_meta_data->>'company_name' FROM auth.users WHERE id = p.user_id),
    'Company ' || p.full_name
  ) as company_name,
  (SELECT raw_user_meta_data->>'contact_phone' FROM auth.users WHERE id = p.user_id) as contact_phone,
  p.email as contact_email
FROM public.profiles p
LEFT JOIN public.clients c ON c.user_id = p.user_id
WHERE
  c.id IS NULL  -- No client record exists
  AND p.role = 'client'  -- Only for client role
ON CONFLICT (user_id) DO NOTHING;


-- =============================================================================
-- PART 3: VERIFICATION QUERIES
-- =============================================================================

-- Check 1: Show clients table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 2: Verify the trigger function exists
SELECT
  '✅ Trigger function created successfully!' as status,
  proname as function_name
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check 3: Verify the trigger exists
SELECT
  '✅ Trigger created successfully!' as status,
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Check 4: Count profiles vs clients to ensure they match
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'client') as total_client_profiles,
  (SELECT COUNT(*) FROM clients) as total_client_records,
  CASE
    WHEN (SELECT COUNT(*) FROM profiles WHERE role = 'client') = (SELECT COUNT(*) FROM clients)
    THEN '✅ All profiles have client records!'
    ELSE '⚠️ Some profiles missing client records - count mismatch'
  END as status;

-- Check 5: List any profiles still missing client records (should be empty)
SELECT
  p.user_id,
  p.email,
  p.full_name,
  p.created_at,
  '❌ Missing client record' as issue
FROM profiles p
LEFT JOIN clients c ON c.user_id = p.user_id
WHERE c.id IS NULL AND p.role = 'client';

-- Check 6: Show recent client records
SELECT
  c.id,
  c.company_name,
  c.contact_phone,
  c.created_at,
  '✅ Client record exists' as status
FROM clients c
ORDER BY c.created_at DESC
LIMIT 10;
