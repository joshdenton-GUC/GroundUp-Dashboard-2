-- ============================================================================
-- VERIFY AND FIX SIGN-UP DATA SAVING
-- ============================================================================
-- This migration verifies that the handle_new_user trigger is working correctly
-- and ensures all sign-up data is being saved to the clients table.
-- ============================================================================

-- Step 1: Verify the trigger exists and is active
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
        AND tgrelid = 'auth.users'::regclass
    ) THEN
        RAISE NOTICE 'WARNING: Trigger on_auth_user_created does NOT exist!';
        RAISE NOTICE 'The handle_new_user function will not run automatically.';
    ELSE
        RAISE NOTICE 'OK: Trigger on_auth_user_created exists and is active.';
    END IF;
END $$;

-- Step 2: Verify the handle_new_user function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'handle_new_user'
    ) THEN
        RAISE NOTICE 'ERROR: Function handle_new_user does NOT exist!';
    ELSE
        RAISE NOTICE 'OK: Function handle_new_user exists.';
    END IF;
END $$;

-- Step 3: Ensure the function is up-to-date with address fields
-- This is the latest version that handles separate address fields
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
  -- Log the trigger execution
  RAISE LOG 'handle_new_user trigger fired for user: %', NEW.email;

  -- Get the current count of profiles to generate the next user ID
  SELECT COUNT(*) + 1 INTO v_profile_count FROM public.profiles;

  -- Generate the user ID in format "User_XX" where XX is zero-padded
  v_user_id := 'User_' || LPAD(v_profile_count::TEXT, 2, '0');

  -- Insert profile record with generated user ID
  BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      v_user_id,
      'client'
    );
    RAISE LOG 'Profile created successfully for user: %', NEW.email;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.email, SQLERRM;
    RAISE;
  END;

  -- Extract company information from user metadata
  v_company_name := NEW.raw_user_meta_data ->> 'company_name';
  v_contact_phone := NEW.raw_user_meta_data ->> 'contact_phone';
  v_street1 := NEW.raw_user_meta_data ->> 'street1';
  v_street2 := NEW.raw_user_meta_data ->> 'street2';
  v_city := NEW.raw_user_meta_data ->> 'city';
  v_state := NEW.raw_user_meta_data ->> 'state';
  v_zip := NEW.raw_user_meta_data ->> 'zip';

  RAISE LOG 'Extracted metadata - Company: %, Phone: %', v_company_name, v_contact_phone;

  -- Create client record if company name is provided
  IF v_company_name IS NOT NULL AND v_company_name != '' THEN
    BEGIN
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
      ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        contact_phone = EXCLUDED.contact_phone,
        street1 = EXCLUDED.street1,
        street2 = EXCLUDED.street2,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        zip = EXCLUDED.zip,
        updated_at = NOW();

      RAISE LOG 'Client record created/updated successfully for user: %', NEW.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create client for user %: %', NEW.email, SQLERRM;
      -- Don't raise error here to prevent blocking user creation
    END;
  ELSE
    RAISE LOG 'No company name provided, skipping client record creation for: %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 4: Ensure the trigger exists (recreate if needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

RAISE NOTICE 'Trigger on_auth_user_created has been recreated successfully.';

-- Step 5: Check for any users with profiles but no client records
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.profiles p
  LEFT JOIN public.clients c ON c.user_id = p.user_id
  WHERE p.role = 'client' AND c.id IS NULL;

  IF v_count > 0 THEN
    RAISE NOTICE 'WARNING: Found % profile(s) with role=client but no client record!', v_count;
    RAISE NOTICE 'Run the migration 20251110000001_backfill_missing_clients.sql to fix this.';
  ELSE
    RAISE NOTICE 'OK: All client profiles have corresponding client records.';
  END IF;
END $$;

-- Step 6: Verify clients table has the correct columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clients'
    AND column_name = 'street1'
  ) THEN
    RAISE NOTICE 'ERROR: Column street1 does not exist in clients table!';
    RAISE NOTICE 'Run migration 20251009100000_add_address_fields_to_clients.sql';
  ELSE
    RAISE NOTICE 'OK: Address fields exist in clients table.';
  END IF;
END $$;

-- Step 7: Check RLS policies on clients table
DO $$
DECLARE
  v_has_insert_policy BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clients'
    AND cmd = 'INSERT'
  ) INTO v_has_insert_policy;

  IF NOT v_has_insert_policy THEN
    RAISE NOTICE 'WARNING: No INSERT policy found on clients table.';
    RAISE NOTICE 'This might prevent client records from being created.';
  ELSE
    RAISE NOTICE 'OK: INSERT policies exist on clients table.';
  END IF;
END $$;

-- Step 8: Display summary of current data
DO $$
DECLARE
  v_total_users INTEGER;
  v_total_profiles INTEGER;
  v_total_clients INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM auth.users;
  SELECT COUNT(*) INTO v_total_profiles FROM public.profiles;
  SELECT COUNT(*) INTO v_total_clients FROM public.clients;

  RAISE NOTICE '';
  RAISE NOTICE '=== SUMMARY ===';
  RAISE NOTICE 'Total users in auth.users: %', v_total_users;
  RAISE NOTICE 'Total profiles: %', v_total_profiles;
  RAISE NOTICE 'Total client records: %', v_total_clients;
  RAISE NOTICE '';

  IF v_total_users != v_total_profiles THEN
    RAISE NOTICE 'WARNING: User count does not match profile count!';
  END IF;
END $$;
