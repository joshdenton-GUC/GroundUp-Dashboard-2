-- =============================================================================
-- FIX EMAIL ALERTS RLS POLICIES
-- =============================================================================
-- This migration fixes the RLS policies for email_alerts table to use
-- get_user_role() function instead of direct profile queries, which prevents
-- circular dependency issues and ensures admins can properly save email alerts.
-- =============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.email_alerts ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for email_alerts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can select email alerts" ON public.email_alerts;
  DROP POLICY IF EXISTS "Admins can insert email alerts" ON public.email_alerts;
  DROP POLICY IF EXISTS "Admins can update email alerts" ON public.email_alerts;
  DROP POLICY IF EXISTS "Admins can delete email alerts" ON public.email_alerts;
  DROP POLICY IF EXISTS "Admins can manage email alerts" ON public.email_alerts;
  DROP POLICY IF EXISTS "Admins can view email alerts" ON public.email_alerts;
END $$;

-- Create new RLS policies using get_user_role() function
-- This approach uses SECURITY DEFINER to bypass RLS and avoid circular dependencies

CREATE POLICY "Admins can select email alerts"
  ON public.email_alerts
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert email alerts"
  ON public.email_alerts
  FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update email alerts"
  ON public.email_alerts
  FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete email alerts"
  ON public.email_alerts
  FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_alerts TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Admins can select email alerts" ON public.email_alerts IS
  'Allows admin users to view all email alert configurations';

COMMENT ON POLICY "Admins can insert email alerts" ON public.email_alerts IS
  'Allows admin users to create new email alert configurations';

COMMENT ON POLICY "Admins can update email alerts" ON public.email_alerts IS
  'Allows admin users to update existing email alert configurations';

COMMENT ON POLICY "Admins can delete email alerts" ON public.email_alerts IS
  'Allows admin users to delete email alert configurations';
