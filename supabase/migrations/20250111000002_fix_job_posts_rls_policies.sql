-- =============================================================================
-- FIX JOB_POSTS RLS POLICIES
-- =============================================================================
-- This migration fixes RLS policies for job_posts table to allow clients
-- to create, view, update, and delete their own job posts while admins
-- can manage all job posts.
--
-- The issue was caused by overly restrictive or missing INSERT policies
-- that prevented clients from creating new job postings.
-- =============================================================================

-- Enable RLS
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DO $$
BEGIN
  DROP POLICY IF EXISTS "Clients can insert their own jobs" ON public.job_posts;
  DROP POLICY IF EXISTS "Clients can view their own jobs" ON public.job_posts;
  DROP POLICY IF EXISTS "Clients can update their own jobs" ON public.job_posts;
  DROP POLICY IF EXISTS "Clients can delete their own jobs" ON public.job_posts;
  DROP POLICY IF EXISTS "Admins can view all jobs" ON public.job_posts;
  DROP POLICY IF EXISTS "Admins can insert jobs" ON public.job_posts;
  DROP POLICY IF EXISTS "Admins can update all jobs" ON public.job_posts;
  DROP POLICY IF EXISTS "Admins can delete jobs" ON public.job_posts;
  DROP POLICY IF EXISTS "Admins can manage all job posts" ON public.job_posts;
  DROP POLICY IF EXISTS "Clients can read their own job posts" ON public.job_posts;
  DROP POLICY IF EXISTS "Clients can insert their own job posts" ON public.job_posts;
  DROP POLICY IF EXISTS "Clients can update their own job posts" ON public.job_posts;
  DROP POLICY IF EXISTS "Admins can read all job posts" ON public.job_posts;
END $$;

-- ============================================================================
-- CLIENT POLICIES - Allow clients to manage their own job posts
-- ============================================================================

CREATE POLICY "Clients can view their own jobs"
  ON public.job_posts
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can insert their own jobs"
  ON public.job_posts
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update their own jobs"
  ON public.job_posts
  FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can delete their own jobs"
  ON public.job_posts
  FOR DELETE
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- ADMIN POLICIES - Allow admins to manage all job posts
-- ============================================================================

CREATE POLICY "Admins can view all jobs"
  ON public.job_posts
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert jobs"
  ON public.job_posts
  FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all jobs"
  ON public.job_posts
  FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete jobs"
  ON public.job_posts
  FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_posts TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Clients can view their own jobs" ON public.job_posts IS
  'Allows clients to view their own job postings';

COMMENT ON POLICY "Clients can insert their own jobs" ON public.job_posts IS
  'Allows clients to create new job postings for their company';

COMMENT ON POLICY "Clients can update their own jobs" ON public.job_posts IS
  'Allows clients to update their own job postings';

COMMENT ON POLICY "Clients can delete their own jobs" ON public.job_posts IS
  'Allows clients to delete their own job postings';

COMMENT ON POLICY "Admins can view all jobs" ON public.job_posts IS
  'Allows admins to view all job postings from all clients';

COMMENT ON POLICY "Admins can insert jobs" ON public.job_posts IS
  'Allows admins to create job postings on behalf of clients';

COMMENT ON POLICY "Admins can update all jobs" ON public.job_posts IS
  'Allows admins to update any job posting';

COMMENT ON POLICY "Admins can delete jobs" ON public.job_posts IS
  'Allows admins to delete any job posting';
