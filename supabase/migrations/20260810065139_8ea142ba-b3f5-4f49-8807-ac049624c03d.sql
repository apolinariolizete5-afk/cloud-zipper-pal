CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  RETURN QUERY
    SELECT ur.user_id, u.email::text, ur.created_at
    FROM public.user_roles ur JOIN auth.users u ON u.id = ur.user_id
    WHERE ur.role = 'admin' ORDER BY ur.created_at;
END; $$;

CREATE OR REPLACE FUNCTION public.grant_admin_by_email(target_email text)
RETURNS TABLE (user_id uuid, email text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT u.id INTO target FROM auth.users u WHERE lower(u.email) = lower(target_email) LIMIT 1;
  IF target IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (target, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN QUERY SELECT target, lower(target_email);
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_admin(target_user_id uuid)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE remaining int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT count(*) INTO remaining FROM public.user_roles WHERE role = 'admin';
  IF remaining <= 1 THEN RAISE EXCEPTION 'Não é possível remover o último administrador'; END IF;
  DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin';
  RETURN FOUND;
END; $$;

CREATE OR REPLACE FUNCTION public.reset_admins()
RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE removed int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  WITH d AS (DELETE FROM public.user_roles WHERE role = 'admin' RETURNING 1)
  SELECT count(*) INTO removed FROM d;
  RETURN removed;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_admins() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_admin_by_email(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revoke_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reset_admins() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.grant_admin_by_email(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_admins() TO authenticated, service_role;