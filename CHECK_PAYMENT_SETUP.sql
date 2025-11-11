-- =============================================================================
-- CHECK PAYMENT SYSTEM SETUP
-- =============================================================================
-- RUN THIS IN: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/sql
-- =============================================================================

-- Check 1: Does payment_transactions table exist?
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'payment_transactions'
) as payment_transactions_exists;

-- Check 2: If it exists, show its structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_transactions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 3: Show recent job posts to verify they're saving correctly
SELECT
  id,
  client_id,
  title,
  status,
  payment_status,
  amount_cents,
  created_at
FROM job_posts
ORDER BY created_at DESC
LIMIT 5;
