-- ================================================
-- Rate Limits Configuration Table
-- Dynamic rate limits that can be controlled from Supabase
-- ================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT UNIQUE NOT NULL,
  limit_count INT NOT NULL DEFAULT 10,
  window_seconds INT NOT NULL DEFAULT 3600,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON rate_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to read (for API to check limits)
CREATE POLICY "Authenticated can read" ON rate_limits
  FOR SELECT TO authenticated USING (true);

-- Insert default rate limits
INSERT INTO rate_limits (action, limit_count, window_seconds, description) VALUES
  ('api', 60, 60, 'General API requests per minute'),
  ('generate', 5, 3600, 'Website generation per hour'),
  ('voice', 10, 3600, 'Voice input per hour'),
  ('redesign', 3, 86400, 'Redesign per day'),
  ('publish', 20, 3600, 'Publish per hour'),
  ('edit', 30, 3600, 'Edit per hour')
ON CONFLICT (action) DO UPDATE SET
  limit_count = EXCLUDED.limit_count,
  window_seconds = EXCLUDED.window_seconds,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_rate_limits_updated_at ON rate_limits;
CREATE TRIGGER trigger_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limits_updated_at();

COMMENT ON TABLE rate_limits IS 'Dynamic rate limits configuration. Modify these values to adjust API limits without code changes.';
