-- =============================================================================
-- ADD MISSING COLUMNS TO JOB_POSTS TABLE
-- =============================================================================
-- RUN THIS IN: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/sql
-- =============================================================================

-- Add missing payment columns
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS amount_cents INTEGER NOT NULL DEFAULT 50000;

-- Add missing timestamp columns
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add missing company columns
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS company_email TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS company_website TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS company_description TEXT;

-- Add soft delete column
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Fix company_name to be NOT NULL (as per migration)
ALTER TABLE job_posts ALTER COLUMN company_name SET NOT NULL;

-- Fix client_id to be NOT NULL (as per migration)
ALTER TABLE job_posts ALTER COLUMN client_id SET NOT NULL;

-- Verify all columns are now present
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'job_posts'
  AND table_schema = 'public'
ORDER BY ordinal_position;
