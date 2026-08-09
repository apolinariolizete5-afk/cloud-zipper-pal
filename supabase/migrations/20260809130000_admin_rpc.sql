-- ============================================================
-- Polyset Store - Admin RPC
-- Remove the need for SUPABASE_SERVICE_ROLE_KEY in the app
-- ============================================================

-- Check whether at least one admin exists
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.admin_exists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;


-- Claim first admin
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilizador não autenticado.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;


-- Verify current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;


-- List administrators and their emails
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    ur.user_id,
    COALESCE(au.email, '(utilizador removido)') AS email,
    ur.created_at
  FROM public.user_roles ur
  LEFT JOIN auth.users au
    ON au.id = ur.user_id
  WHERE ur.role = 'admin'
    AND EXISTS (
      SELECT 1
      FROM public.user_roles me
      WHERE me.user_id = auth.uid()
        AND me.role = 'admin'
    )
  ORDER BY ur.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.list_admins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;


-- Grant admin role by email
CREATE OR REPLACE FUNCTION public.grant_admin_by_email(target_email text)
RETURNS TABLE (
  user_id uuid,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user_id uuid;
  target_user_email text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;

  SELECT au.id, au.email
  INTO target_user_id, target_user_email
  FROM auth.users au
  WHERE lower(au.email) = lower(trim(target_email))
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilizador não encontrado. Peça-lhe para criar conta primeiro.';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN QUERY
  SELECT target_user_id, target_user_email;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_admin_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_admin_by_email(text) TO authenticated;


-- Revoke administrator
CREATE OR REPLACE FUNCTION public.revoke_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Não pode remover o seu próprio acesso.';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = target_user_id
    AND role = 'admin';

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_admin(uuid) TO authenticated;


-- Reset all admin roles.
-- Account deletion is deliberately NOT performed here because deleting
-- auth.users requires the Supabase Admin API/service-role key.
CREATE OR REPLACE FUNCTION public.reset_admins()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  removed_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;

  SELECT count(*)
  INTO removed_count
  FROM public.user_roles
  WHERE role = 'admin';

  DELETE FROM public.user_roles
  WHERE role = 'admin';

  RETURN removed_count;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_admins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_admins() TO authenticated;
