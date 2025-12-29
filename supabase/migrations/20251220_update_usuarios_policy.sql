CREATE OR REPLACE FUNCTION public.get_my_igreja_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT igreja_id FROM public.usuarios WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_papel()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT papel::text FROM public.usuarios WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_my_igreja_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_papel() TO authenticated;

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_update_usuarios_mesma_igreja" ON public.usuarios;
CREATE POLICY "admin_update_usuarios_mesma_igreja" ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  public.get_my_papel() = 'admin'
  AND igreja_id = public.get_my_igreja_id()
)
WITH CHECK (
  public.get_my_papel() = 'admin'
  AND (igreja_id = public.get_my_igreja_id() OR igreja_id IS NULL)
);
