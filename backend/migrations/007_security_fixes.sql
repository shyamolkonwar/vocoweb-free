-- ================================================
-- Security Fix Migration: DB-VULN-01 & DB-VULN-02
-- Fixes SECURITY DEFINER functions without search_path
-- and removes overly permissive rate_limits read policy
-- Run this in your Supabase SQL Editor
-- ================================================

-- ================================================
-- DB-VULN-01: Fix SECURITY DEFINER Functions
-- Add SET search_path = public to prevent search_path hijacking
-- ================================================

-- 1. Fix deduct_credits function
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INT,
  p_action TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Prevent search_path hijacking
AS $$
DECLARE
  v_current_balance INT;
  v_new_balance INT;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM public.credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if enough credits
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;
  
  -- Update credits
  UPDATE public.credits
  SET balance = v_new_balance,
      lifetime_spent = lifetime_spent + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, action, description)
  VALUES (p_user_id, -p_amount, v_new_balance, p_action, p_description);
  
  RETURN TRUE;
END;
$$;

-- 2. Fix get_lead_stats function
CREATE OR REPLACE FUNCTION get_lead_stats(p_user_id UUID)
RETURNS TABLE (
    total_leads BIGINT,
    new_leads BIGINT,
    contacted_leads BIGINT,
    converted_leads BIGINT,
    leads_this_week BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Prevent search_path hijacking
AS $$
    SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE status = 'new') as new_leads,
        COUNT(*) FILTER (WHERE status = 'contacted') as contacted_leads,
        COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as leads_this_week
    FROM public.leads
    WHERE website_id IN (
        SELECT id FROM public.websites WHERE owner_id = p_user_id
    );
$$;

-- 3. Fix get_credit_cost function (add search_path for consistency)
CREATE OR REPLACE FUNCTION get_credit_cost(p_action TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY INVOKER  -- Note: This is INVOKER, not DEFINER, but adding search_path for safety
SET search_path = public
AS $$
DECLARE
    v_cost INTEGER;
BEGIN
    SELECT cost INTO v_cost
    FROM public.credit_costs
    WHERE action = p_action AND is_active = true;
    
    RETURN COALESCE(v_cost, 0);
END;
$$;

-- 4. Fix update_rate_limits_updated_at trigger function
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public  -- SECURITY FIX: Add search_path
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ================================================
-- DB-VULN-02: Fix Overly Permissive Rate Limits Policy
-- Remove the policy that allows all authenticated users to read rate limits
-- ================================================

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated can read" ON rate_limits;

-- Rate limits should only be readable by service role (backend API)
-- The backend reads these and applies them - clients don't need direct access
-- (Service role already has full access via existing policy)

-- If you need authenticated users to see their rate limit status,
-- create a restricted view or function instead:
CREATE OR REPLACE FUNCTION get_action_rate_limit(p_action TEXT)
RETURNS TABLE (
    limit_count INT,
    window_seconds INT
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT limit_count, window_seconds
    FROM public.rate_limits
    WHERE action = p_action AND is_active = true;
$$;

GRANT EXECUTE ON FUNCTION get_action_rate_limit(TEXT) TO authenticated;

-- ================================================
-- Grant permissions
-- ================================================
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_lead_stats(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_credit_cost(TEXT) TO authenticated, anon;

-- ================================================
-- Verification: List all functions to confirm search_path is set
-- Run this query after migration to verify:
-- SELECT proname, prosecdef, proconfig 
-- FROM pg_proc 
-- WHERE proname IN ('deduct_credits', 'get_lead_stats', 'handle_new_user', 'get_credit_cost');
-- ================================================

COMMENT ON FUNCTION deduct_credits IS 'Securely deduct credits from user balance. SECURITY DEFINER with search_path protection.';
COMMENT ON FUNCTION get_lead_stats IS 'Get lead statistics for a user. SECURITY DEFINER with search_path protection.';
COMMENT ON FUNCTION get_action_rate_limit IS 'Get rate limit for an action. Replaces direct table access for security.';
