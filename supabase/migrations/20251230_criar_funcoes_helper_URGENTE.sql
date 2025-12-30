-- =====================================================
-- CRIAR FUNÇÕES HELPER QUE ESTAVAM FALTANDO!!!
-- Data: 2025-12-30
-- =====================================================

-- PROBLEMA ENCONTRADO:
-- As políticas RLS estavam usando get_my_papel() e get_my_igreja_id()
-- mas essas funções NÃO EXISTIAM no banco!
-- Por isso TODAS as verificações retornavam NULL e bloqueavam.

-- =====================================================
-- Função: get_my_igreja_id()
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_my_igreja_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT igreja_id FROM public.usuarios WHERE id = auth.uid()
$$;

-- =====================================================
-- Função: get_my_papel()
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_my_papel()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT papel::text FROM public.usuarios WHERE id = auth.uid()
$$;

-- =====================================================
-- Grants
-- =====================================================
GRANT EXECUTE ON FUNCTION public.get_my_igreja_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_papel() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_igreja_id() TO anon;
GRANT EXECUTE ON FUNCTION public.get_my_papel() TO anon;

-- =====================================================
-- Comentários
-- =====================================================
COMMENT ON FUNCTION public.get_my_igreja_id() IS
'Retorna a igreja_id do usuário autenticado atual';

COMMENT ON FUNCTION public.get_my_papel() IS
'Retorna o papel (admin/lider/membro) do usuário autenticado atual';
