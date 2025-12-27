-- ================================================
-- Fix deployments table and add deduct_credits function
-- Run this in your Supabase SQL Editor
-- ================================================

-- 1. Make website_id nullable in deployments (to support legacy site_* IDs)
ALTER TABLE deployments 
  ALTER COLUMN website_id DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS deployments_website_id_fkey;

-- Add external_id column for non-UUID website identifiers
ALTER TABLE deployments 
  ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Index for external_id lookups
CREATE INDEX IF NOT EXISTS idx_deployments_external_id ON deployments(external_id);

-- ================================================
-- Credit deduction function
-- ================================================

CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INT,
  p_action TEXT,
  p_description TEXT DEFAULT ''
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INT;
  v_new_balance INT;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance 
  FROM credits 
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock the row
  
  IF NOT FOUND THEN
    -- Create credits record if doesn't exist
    INSERT INTO credits (user_id, balance) VALUES (p_user_id, 100);
    v_current_balance := 100;
  END IF;
  
  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  v_new_balance := v_current_balance - p_amount;
  
  -- Update balance
  UPDATE credits 
  SET balance = v_new_balance,
      lifetime_spent = lifetime_spent + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, balance_after, action, description)
  VALUES (p_user_id, -p_amount, v_new_balance, p_action, COALESCE(p_description, 'Used for ' || p_action));
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION deduct_credits TO service_role;
GRANT EXECUTE ON FUNCTION deduct_credits TO authenticated;

COMMENT ON FUNCTION deduct_credits IS 'Atomically deduct credits from user balance with transaction logging';
