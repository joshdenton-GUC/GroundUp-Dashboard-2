-- =============================================================================
-- FINAL FIX - CORRECT EMAIL COLUMN
-- =============================================================================
-- RUN THIS IN: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/sql
-- =============================================================================

-- Step 1: Add missing columns
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS street1 TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS street2 TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT false;

-- Step 2: Make email column nullable (if it has NOT NULL constraint)
ALTER TABLE clients ALTER COLUMN email DROP NOT NULL;

-- Step 3: Add unique constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_key;
ALTER TABLE clients ADD CONSTRAINT clients_user_id_key UNIQUE (user_id);

-- Step 4: Drop old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 5: Create new trigger function
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
  SELECT COUNT(*) + 1 INTO v_profile_count FROM public.profiles;
  v_user_id := 'User_' || LPAD(v_profile_count::TEXT, 2, '0');

  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (NEW.id, NEW.email, v_user_id, 'client');

  v_company_name := NEW.raw_user_meta_data ->> 'company_name';
  v_contact_phone := NEW.raw_user_meta_data ->> 'contact_phone';
  v_street1 := NEW.raw_user_meta_data ->> 'street1';
  v_street2 := NEW.raw_user_meta_data ->> 'street2';
  v_city := NEW.raw_user_meta_data ->> 'city';
  v_state := NEW.raw_user_meta_data ->> 'state';
  v_zip := NEW.raw_user_meta_data ->> 'zip';

  IF v_company_name IS NOT NULL AND v_company_name != '' THEN
    INSERT INTO public.clients (user_id, email, company_name, contact_phone, contact_email, street1, street2, city, state, zip)
    VALUES (NEW.id, NEW.email, v_company_name, v_contact_phone, NEW.email, v_street1, v_street2, v_city, v_state, v_zip)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 6: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Backfill existing users (NOW WITH EMAIL COLUMN)
INSERT INTO public.clients (user_id, email, company_name, contact_email)
SELECT p.user_id, p.email, 'Company ' || p.full_name, p.email
FROM public.profiles p
WHERE p.role = 'client'
  AND NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.user_id = p.user_id);

-- Step 8: Verify
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'client') as total_profiles,
  (SELECT COUNT(*) FROM clients) as total_clients,
  CASE
    WHEN (SELECT COUNT(*) FROM profiles WHERE role = 'client') = (SELECT COUNT(*) FROM clients)
    THEN '✅ SUCCESS! All profiles have client records'
    ELSE '⚠️ Mismatch'
  END as status;
