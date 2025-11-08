-- =============================================================================
-- FIX PROFILE AND CLIENT CREATION ON SIGNUP
-- =============================================================================
-- This migration fixes the handle_new_user trigger to ensure both profile
-- and client records are created correctly during signup.
-- This fixes the issue where profiles were not being saved on signup.
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
    ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicates
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
