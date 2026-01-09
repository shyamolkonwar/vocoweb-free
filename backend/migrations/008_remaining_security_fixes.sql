-- ================================================
-- Security Fix Migration 008: Remaining Linter Warnings
-- Fixes function_search_path_mutable for:
-- - get_waitlist_count()
-- - get_next_version()
-- - handle_new_user()
-- Run this in your Supabase SQL Editor
-- ================================================

-- ================================================
-- 1. Fix get_waitlist_count function
-- ================================================

CREATE OR REPLACE FUNCTION get_waitlist_count()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Prevent search_path hijacking
AS $$
  SELECT COUNT(*)::INTEGER FROM public.waitlist;
$$;

GRANT EXECUTE ON FUNCTION get_waitlist_count() TO anon, authenticated, service_role;

-- ================================================
-- 2. Fix get_next_version function
-- ================================================

CREATE OR REPLACE FUNCTION get_next_version(p_website_id UUID)
RETURNS INT
LANGUAGE SQL
STABLE
SET search_path = public  -- SECURITY FIX: Prevent search_path hijacking
AS $$
  SELECT COALESCE(MAX(version), 0) + 1 
  FROM public.website_versions 
  WHERE website_id = p_website_id;
$$;

GRANT EXECUTE ON FUNCTION get_next_version(UUID) TO authenticated, service_role;

-- ================================================
-- 3. Fix handle_new_user trigger function
-- Note: This is a SECURITY DEFINER function that MUST have search_path set
-- ================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Prevent search_path hijacking
AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Also create initial usage limits record
  INSERT INTO public.usage_limits (user_id)
  VALUES (NEW.id);
  
  -- Create initial credits record
  INSERT INTO public.credits (user_id, balance)
  VALUES (NEW.id, 100);  -- Start with 100 free credits
  
  RETURN NEW;
END;
$$;

-- ================================================
-- 4. Leaked Password Protection
-- NOTE: This cannot be fixed via SQL - it requires enabling in Supabase Dashboard
-- Go to: Authentication > Settings > Security > Enable "Leaked Password Protection"
-- Or use the Supabase Management API
-- ================================================

-- The following comment documents the required action:
COMMENT ON SCHEMA public IS 'SECURITY NOTE: Enable Leaked Password Protection in Supabase Dashboard: Authentication > Settings > Security';

-- ================================================
-- Verification Query
-- Run this after migration to confirm all functions have search_path set:
-- ================================================
-- SELECT proname, prosecdef, proconfig 
-- FROM pg_proc 
-- WHERE proname IN (
--   'get_waitlist_count', 
--   'get_next_version', 
--   'handle_new_user',
--   'deduct_credits',
--   'get_lead_stats',
--   'get_credit_cost'
-- );
-- 
-- Expected: All should have proconfig containing 'search_path=public'
-- ================================================
