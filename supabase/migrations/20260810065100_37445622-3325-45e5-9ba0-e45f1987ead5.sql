GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
GRANT USAGE ON TYPE public.app_role TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_product_view(text) TO service_role;