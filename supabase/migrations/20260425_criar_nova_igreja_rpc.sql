-- Corrigir cadastro de nova igreja: o signUp sem confirmação de email não cria
-- sessão imediatamente, então INSERT em igrejas/usuarios falha com role anon.
-- Solução: permitir anon INSERT nas duas tabelas com constraints de segurança.

-- ============================================================
-- Helper: verificar se um UUID existe em auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.auth_user_exists(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id);
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_exists(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.auth_user_exists(uuid) TO authenticated;

-- ============================================================
-- IGREJAS: permitir anon criar igrejas (cadastro inicial)
-- ============================================================
DROP POLICY IF EXISTS "Permitir criar igrejas" ON public.igrejas;
CREATE POLICY "Permitir criar igrejas" ON public.igrejas
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ============================================================
-- USUARIOS: permitir anon inserir apenas usuário com ID válido em auth.users
-- ============================================================
DROP POLICY IF EXISTS "insert_usuarios" ON public.usuarios;
CREATE POLICY "insert_usuarios" ON public.usuarios
  FOR INSERT TO anon, authenticated
  WITH CHECK (public.auth_user_exists(id));
