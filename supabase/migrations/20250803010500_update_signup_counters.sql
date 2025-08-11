-- Keep homepage counters in content table up to date on user/org signup

-- Ensure keys exist
INSERT INTO public.content (page, section, key, value, language_code)
VALUES
  ('homepage', 'impact', 'active_volunteers', '0', 'en'),
  ('homepage', 'impact', 'partner_organizations', '0', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Count active volunteers as number of non-organization users who are active
CREATE OR REPLACE FUNCTION public.update_active_volunteers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE public.content
  SET value = (
    SELECT COUNT(*)::TEXT
    FROM public.profiles p
    WHERE (p.user_type = 'student' OR p.user_type = 'external')
      AND COALESCE(p.status, 'active') = 'active'
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Count partner organizations as number of organizations with approved status
CREATE OR REPLACE FUNCTION public.update_partner_organizations_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE public.content
  SET value = (
    SELECT COUNT(*)::TEXT
    FROM public.organizations o
    WHERE COALESCE(o.status, 'pending') IN ('approved')
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations';

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Reset and (re)create triggers to cover INSERT/UPDATE/DELETE
DROP TRIGGER IF EXISTS trigger_update_active_volunteers_profiles_all ON public.profiles;
CREATE TRIGGER trigger_update_active_volunteers_profiles_all
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_active_volunteers_count();

DROP TRIGGER IF EXISTS trigger_update_partner_organizations_all ON public.organizations;
CREATE TRIGGER trigger_update_partner_organizations_all
  AFTER INSERT OR UPDATE OR DELETE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_partner_organizations_count();

-- Backfill current values
SELECT public.update_active_volunteers_count();
SELECT public.update_partner_organizations_count();


