-- ================================================
-- Update Credits Defaults (Pay to Publish Strategy)
-- Run this in your Supabase SQL Editor
-- ================================================

-- 1. Update default balance for NEW users from 100 to 25
-- This creates the "free trial" experience where users can
-- generate 1-2 sites but must pay to publish (30 credits required)
ALTER TABLE credits 
  ALTER COLUMN balance SET DEFAULT 25;

-- 2. Update the deduct_credits function to use new default
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
    -- Create credits record if doesn't exist (with new default of 25)
    INSERT INTO credits (user_id, balance) VALUES (p_user_id, 25);
    v_current_balance := 25;
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

-- 3. Update handle_new_user trigger to give 25 credits instead of 100
-- Find and update your existing trigger or create one:
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create credits record with 25 credits (down from 100)
  INSERT INTO credits (user_id, balance, lifetime_earned)
  VALUES (NEW.id, 25, 25);
  
  -- Create usage_limits record
  INSERT INTO usage_limits (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION deduct_credits TO service_role;
GRANT EXECUTE ON FUNCTION deduct_credits TO authenticated;

COMMENT ON FUNCTION deduct_credits IS 'Atomically deduct credits from user balance with transaction logging';

-- ================================================
-- IMPORTANT: Credit Costs Reference
-- ================================================
-- generate: 10 credits
-- voice_generate: 15 credits  
-- edit: 2 credits
-- redesign: 20 credits
-- publish: 30 credits (PAYWALL - requires purchase)
--
-- With 25 signup credits, users can:
-- - Generate 1 website (10 credits) = 15 remaining
-- - Edit once (2 credits) = 13 remaining
-- - TRY to publish (needs 30) = BLOCKED → Show upgrade modal
-- ================================================
