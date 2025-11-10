-- ============================================================================
-- BACKFILL MISSING CLIENT RECORDS
-- ============================================================================
-- This migration creates client records for any users who signed up but
-- don't have a corresponding client record in the clients table.
--
-- This can happen if:
-- 1. The trigger failed silently
-- 2. The trigger was not active during sign-up
-- 3. RLS policies prevented the insert
-- ============================================================================

-- Create client records for users with raw_user_meta_data but no client record
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
SELECT
  u.id as user_id,
  u.raw_user_meta_data ->> 'company_name' as company_name,
  u.raw_user_meta_data ->> 'contact_phone' as contact_phone,
  u.raw_user_meta_data ->> 'street1' as street1,
  u.raw_user_meta_data ->> 'street2' as street2,
  u.raw_user_meta_data ->> 'city' as city,
  u.raw_user_meta_data ->> 'state' as state,
  u.raw_user_meta_data ->> 'zip' as zip
FROM auth.users u
INNER JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.clients c ON c.user_id = u.id
WHERE
  p.role = 'client' -- Only for users with client role
  AND c.id IS NULL -- No existing client record
  AND u.raw_user_meta_data ->> 'company_name' IS NOT NULL -- Has company name in metadata
  AND u.raw_user_meta_data ->> 'company_name' != '' -- Company name is not empty
ON CONFLICT (user_id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  contact_phone = EXCLUDED.contact_phone,
  street1 = EXCLUDED.street1,
  street2 = EXCLUDED.street2,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  zip = EXCLUDED.zip,
  updated_at = NOW();

-- Log the results
DO $$
DECLARE
  v_backfilled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_backfilled_count
  FROM public.clients
  WHERE created_at >= NOW() - INTERVAL '1 minute';

  IF v_backfilled_count > 0 THEN
    RAISE NOTICE 'Successfully backfilled % client record(s)', v_backfilled_count;
  ELSE
    RAISE NOTICE 'No missing client records found to backfill';
  END IF;
END $$;
