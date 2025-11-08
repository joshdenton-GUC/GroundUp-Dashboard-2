-- =============================================================================
-- VERIFY AND FIX JOB_POSTS TABLE
-- =============================================================================
-- RUN THIS IN: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/sql
-- =============================================================================

-- Check 1: Verify job_posts table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'job_posts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 2: Verify RLS policies on job_posts
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'job_posts';

-- Check 3: Count job posts
SELECT COUNT(*) as total_job_posts FROM public.job_posts;

-- Check 4: Try to query as current user would
SELECT * FROM public.job_posts LIMIT 1;
