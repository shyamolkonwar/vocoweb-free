-- ================================================
-- Supabase Migration: Leads Table
-- Run this in your Supabase SQL Editor after v2 schema
-- ================================================

-- ================================================
-- LEADS TABLE (Universal Lead Capture)
-- ================================================

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    message TEXT,
    service_interested TEXT,
    source_page TEXT DEFAULT 'contact',
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_leads_website_id ON leads(website_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS POLICIES
-- ================================================

-- Service role full access (for backend API)
CREATE POLICY "Service role full access" ON leads
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public can INSERT leads (form submissions from generated sites)
CREATE POLICY "Public insert leads" ON leads
    FOR INSERT TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM websites WHERE websites.id = website_id
        )
    );

-- Website owners can view their leads
CREATE POLICY "Owners can view leads" ON leads
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM websites 
            WHERE websites.id = leads.website_id 
            AND websites.owner_id = auth.uid()
        )
    );

-- Website owners can update lead status
CREATE POLICY "Owners can update leads" ON leads
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM websites 
            WHERE websites.id = leads.website_id 
            AND websites.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM websites 
            WHERE websites.id = leads.website_id 
            AND websites.owner_id = auth.uid()
        )
    );

-- ================================================
-- POPUP SETTINGS TABLE (Per-website popup config)
-- ================================================

CREATE TABLE IF NOT EXISTS popup_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID UNIQUE NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    headline TEXT DEFAULT 'Get a Free Quote!',
    subheadline TEXT DEFAULT 'Fill in your details and we''ll get back to you.',
    offer_text TEXT,
    trigger_type TEXT DEFAULT 'time' CHECK (trigger_type IN ('time', 'exit', 'scroll')),
    trigger_delay_seconds INT DEFAULT 5,
    trigger_scroll_percent INT DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_popup_settings_website_id ON popup_settings(website_id);

-- Enable RLS
ALTER TABLE popup_settings ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access" ON popup_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Owners can view/update their popup settings
CREATE POLICY "Owners can manage popup settings" ON popup_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM websites 
            WHERE websites.id = popup_settings.website_id 
            AND websites.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM websites 
            WHERE websites.id = popup_settings.website_id 
            AND websites.owner_id = auth.uid()
        )
    );

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to get lead stats for a user
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
AS $$
    SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE status = 'new') as new_leads,
        COUNT(*) FILTER (WHERE status = 'contacted') as contacted_leads,
        COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as leads_this_week
    FROM leads
    WHERE website_id IN (
        SELECT id FROM websites WHERE owner_id = p_user_id
    );
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION get_lead_stats(UUID) TO authenticated, service_role;

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE leads IS 'Lead capture from generated websites';
COMMENT ON TABLE popup_settings IS 'Popup configuration per website';
COMMENT ON COLUMN leads.source_page IS 'Page where lead was captured (index, contact, etc)';
COMMENT ON COLUMN leads.status IS 'Lead status: new, contacted, converted';
