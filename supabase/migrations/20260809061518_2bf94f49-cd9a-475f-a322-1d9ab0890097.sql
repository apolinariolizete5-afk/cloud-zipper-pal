GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon, service_role;
GRANT USAGE ON TYPE public.app_role TO authenticated, anon, service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_product_view(text) TO authenticated, anon, service_role;
INSERT INTO public.user_roles (user_id, role)
SELECT '61782a37-3f39-4b05-b57c-c34448fe5773'::uuid, 'admin'::app_role
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '61782a37-3f39-4b05-b57c-c34448fe5773')
ON CONFLICT (user_id, role) DO NOTHING;