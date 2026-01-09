-- ================================================
-- Dynamic Configuration Tables
-- Allows changing credit costs and payment links
-- without code changes
-- Run this in your Supabase SQL Editor
-- ================================================

-- ================================================
-- 1. Credit Costs Table
-- Stores the cost of each action in credits
-- ================================================

CREATE TABLE IF NOT EXISTS credit_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL UNIQUE,
    cost INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default values
INSERT INTO credit_costs (action, cost, description) VALUES
    ('generate', 10, 'Generate a new website from text prompt'),
    ('voice_generate', 15, 'Generate a website using voice input'),
    ('edit', 2, 'Make an edit to an existing website'),
    ('redesign', 20, 'Complete redesign of a website'),
    ('publish', 30, 'Publish website to production (paywall)')
ON CONFLICT (action) DO UPDATE SET
    cost = EXCLUDED.cost,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Enable RLS
ALTER TABLE credit_costs ENABLE ROW LEVEL SECURITY;

-- Public read access (costs should be visible to everyone)
CREATE POLICY "credit_costs_public_read" ON credit_costs
    FOR SELECT USING (true);

-- Only service role can update
CREATE POLICY "credit_costs_service_update" ON credit_costs
    FOR ALL USING (auth.role() = 'service_role');

-- ================================================
-- 2. Payment Links Table
-- Stores payment links for different markets
-- ================================================

CREATE TABLE IF NOT EXISTS payment_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    market TEXT NOT NULL,  -- 'IN', 'GLOBAL', etc.
    plan_name TEXT NOT NULL DEFAULT 'pro', -- 'pro', 'starter', 'enterprise'
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_type TEXT NOT NULL DEFAULT 'one-time', -- 'one-time', 'monthly', 'yearly'
    provider TEXT NOT NULL, -- 'razorpay', 'stripe', 'cashfree'
    payment_url TEXT NOT NULL,
    features JSONB DEFAULT '[]'::jsonb, -- List of features for this plan
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(market, plan_name)
);

-- Insert default payment links (update with actual URLs)
INSERT INTO payment_links (market, plan_name, amount, currency, billing_type, provider, payment_url, features) VALUES
    ('IN', 'pro', 5999.00, 'INR', 'one-time', 'razorpay', 
     'https://razorpay.me/@vocoweb',
     '["Unlimited Credits", "Custom Domain", "WhatsApp Booking", "Priority Support", "Lifetime Updates"]'::jsonb),
    ('GLOBAL', 'pro', 39.00, 'USD', 'monthly', 'stripe',
     'https://buy.stripe.com/test',
     '["Unlimited Credits", "Custom Domain", "Contact Form Integration", "Priority Support", "Monthly Updates"]'::jsonb)
ON CONFLICT (market, plan_name) DO UPDATE SET
    amount = EXCLUDED.amount,
    currency = EXCLUDED.currency,
    billing_type = EXCLUDED.billing_type,
    provider = EXCLUDED.provider,
    payment_url = EXCLUDED.payment_url,
    features = EXCLUDED.features,
    updated_at = NOW();

-- Enable RLS
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- Public read access for active links
CREATE POLICY "payment_links_public_read" ON payment_links
    FOR SELECT USING (is_active = true);

-- Only service role can update
CREATE POLICY "payment_links_service_update" ON payment_links
    FOR ALL USING (auth.role() = 'service_role');

-- ================================================
-- 3. Helper function to get credit cost
-- ================================================

CREATE OR REPLACE FUNCTION get_credit_cost(p_action TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_cost INTEGER;
BEGIN
    SELECT cost INTO v_cost
    FROM credit_costs
    WHERE action = p_action AND is_active = true;
    
    RETURN COALESCE(v_cost, 0);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_credit_cost TO authenticated;
GRANT EXECUTE ON FUNCTION get_credit_cost TO anon;

-- ================================================
-- 4. Indexes for performance
-- ================================================

CREATE INDEX IF NOT EXISTS idx_credit_costs_action ON credit_costs(action);
CREATE INDEX IF NOT EXISTS idx_payment_links_market ON payment_links(market);
CREATE INDEX IF NOT EXISTS idx_payment_links_active ON payment_links(is_active);

-- ================================================
-- COMMENTS
-- ================================================
COMMENT ON TABLE credit_costs IS 'Configurable credit costs for each action - update here instead of code';
COMMENT ON TABLE payment_links IS 'Payment links for different markets - update URLs here instead of code';
COMMENT ON FUNCTION get_credit_cost IS 'Get credit cost for an action from the database';
