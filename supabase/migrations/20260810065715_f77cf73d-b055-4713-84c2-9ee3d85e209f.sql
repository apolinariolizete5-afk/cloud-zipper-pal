CREATE OR REPLACE FUNCTION public.get_public_order_settings()
RETURNS TABLE(id integer, mode text, whatsapp_number text, whatsapp_template text, external_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.mode, s.whatsapp_number, s.whatsapp_template, s.external_url
  FROM public.order_settings s
  WHERE s.id = 1
$$;

REVOKE ALL ON FUNCTION public.get_public_order_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order_settings() TO anon, authenticated, service_role;