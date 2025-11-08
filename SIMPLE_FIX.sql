-- =============================================================================
-- SIMPLE FIX FOR PROFILE SIGNUP ISSUE
-- =============================================================================
-- RUN THIS IN: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/sql
-- =============================================================================

-- Step 1: Add missing columns to clients table (safe if already exists)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS street1 TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS street2 TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT false;

-- Step 2: Drop old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 3: Create new trigger function
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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
  -- Generate user ID
  SELECT COUNT(*) + 1 INTO v_profile_count FROM public.profiles;
  v_user_id := 'User_' || LPAD(v_profile_count::TEXT, 2, '0');

  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (NEW.id, NEW.email, v_user_id, 'client');

  -- Get metadata
  v_company_name := NEW.raw_user_meta_data ->> 'company_name';
  v_contact_phone := NEW.raw_user_meta_data ->> 'contact_phone';
  v_street1 := NEW.raw_user_meta_data ->> 'street1';
  v_street2 := NEW.raw_user_meta_data ->> 'street2';
  v_city := NEW.raw_user_meta_data ->> 'city';
  v_state := NEW.raw_user_meta_data ->> 'state';
  v_zip := NEW.raw_user_meta_data ->> 'zip';

  -- Create client if company provided
  IF v_company_name IS NOT NULL AND v_company_name != '' THEN
    INSERT INTO public.clients (user_id, company_name, contact_phone, street1, street2, city, state, zip)
    VALUES (NEW.id, v_company_name, v_contact_phone, v_street1, v_street2, v_city, v_state, v_zip)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 4: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Backfill missing client records
INSERT INTO public.clients (user_id, company_name, contact_email)
SELECT p.user_id, 'Company ' || p.full_name, p.email
FROM public.profiles p
LEFT JOIN public.clients c ON c.user_id = p.user_id
WHERE c.id IS NULL AND p.role = 'client'
ON CONFLICT (user_id) DO NOTHING;

-- Step 6: Verify
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'client') as profiles_count,
  (SELECT COUNT(*) FROM clients) as clients_count;
