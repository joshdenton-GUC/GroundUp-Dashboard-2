-- =============================================================================
-- FIX EMAIL_ALERTS TABLE STRUCTURE
-- =============================================================================
-- The original email_alerts table had the wrong structure (it was designed for
-- storing sent emails, not for configuring alert rules). This migration:
-- 1. Renames the old table to email_notifications_log (as a backup)
-- 2. Creates the correct email_alerts table for alert configurations
-- 3. Adds proper RLS policies for admin access
-- =============================================================================

-- Step 1: Drop policies from old table if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can select email alerts" ON public.email_alerts;
  DROP POLICY IF EXISTS "Admins can insert email alerts" ON public.email_alerts;
  DROP POLICY IF EXISTS "Admins can update email alerts" ON public.email_alerts;
  DROP POLICY IF EXISTS "Admins can delete email alerts" ON public.email_alerts;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Step 2: Rename the old table to preserve it (it's for email logs)
DO $$
BEGIN
  ALTER TABLE IF EXISTS public.email_alerts RENAME TO email_notifications_log;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Step 3: Create the CORRECT email_alerts table for alert configurations
CREATE TABLE IF NOT EXISTS public.email_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 4: Enable RLS
ALTER TABLE public.email_alerts ENABLE ROW LEVEL SECURITY;

-- Step 5: Create the correct policies
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

-- Step 6: Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create updated_at trigger
DROP TRIGGER IF EXISTS update_email_alerts_updated_at ON public.email_alerts;
CREATE TRIGGER update_email_alerts_updated_at
BEFORE UPDATE ON public.email_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 8: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_alerts TO authenticated;

-- Step 9: Add helpful comments
COMMENT ON TABLE public.email_alerts IS 'Configuration table for email alert rules (who gets notified for what events)';

COMMENT ON POLICY "Admins can select email alerts" ON public.email_alerts IS
  'Allows admin users to view all email alert configurations';

COMMENT ON POLICY "Admins can insert email alerts" ON public.email_alerts IS
  'Allows admin users to create new email alert configurations';

COMMENT ON POLICY "Admins can update email alerts" ON public.email_alerts IS
  'Allows admin users to update existing email alert configurations';

COMMENT ON POLICY "Admins can delete email alerts" ON public.email_alerts IS
  'Allows admin users to delete email alert configurations';
