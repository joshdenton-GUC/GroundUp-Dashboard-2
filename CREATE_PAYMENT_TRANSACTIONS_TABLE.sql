-- =============================================================================
-- CREATE PAYMENT_TRANSACTIONS TABLE
-- =============================================================================
-- RUN THIS IN: https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/sql
-- =============================================================================

-- Create payment_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_post_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded')),
  stripe_charge_id TEXT,
  stripe_receipt_url TEXT,
  failure_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_job_post_id
  ON public.payment_transactions(job_post_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_payment_intent_id
  ON public.payment_transactions(stripe_payment_intent_id);

-- Add RLS policies
CREATE POLICY "Clients can view their own payment transactions"
ON public.payment_transactions
FOR SELECT
USING (
  job_post_id IN (
    SELECT jp.id FROM public.job_posts jp
    JOIN public.clients c ON c.id = jp.client_id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all payment transactions"
ON public.payment_transactions
FOR SELECT
USING (public.get_user_role(auth.uid()) = 'admin');

-- Add updated_at trigger
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Verify table was created
SELECT
  'payment_transactions table created successfully!' as status,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'payment_transactions';
