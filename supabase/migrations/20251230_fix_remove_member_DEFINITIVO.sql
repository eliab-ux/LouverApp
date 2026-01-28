-- =====================================================
-- Fix: Permitir admin remover membros - SOLUÇÃO DEFINITIVA
-- Data: 2025-12-30
-- =====================================================

-- PROBLEMA RAIZ ENCONTRADO:
-- Quando há múltiplas políticas PERMISSIVE para UPDATE, o PostgreSQL
-- avalia TODAS elas, e se qualquer WITH CHECK falhar, bloqueia.
--
-- A política "update_meu_usuario" tinha:
--   USING: (id = auth.uid())
--   WITH CHECK: (id = auth.uid()) AND (igreja_id = get_my_igreja_id())
--
-- Quando admin remove outro usuário:
--   - USING falha (id != auth.uid())
--   - PostgreSQL ainda verifica WITH CHECK de TODAS as políticas UPDATE
--   - WITH CHECK falha porque igreja_id será NULL
--
-- SOLUÇÃO: Usar políticas RESTRICTIVE (modo AND) em vez de PERMISSIVE

-- =====================================================
-- PASSO 1: Remover políticas UPDATE antigas
-- =====================================================
DROP POLICY IF EXISTS "admin_update_usuarios_mesma_igreja" ON public.usuarios;
DROP POLICY IF EXISTS "update_meu_usuario" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON public.usuarios;

-- =====================================================
-- PASSO 2: Criar UMA ÚNICA política PERMISSIVE para UPDATE
-- que cobre TODOS os casos
-- =====================================================

CREATE POLICY "usuarios_update_unified" ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  -- Permite UPDATE em qualquer um destes casos:
  (
    -- Caso 1: Sou admin e o usuário é da minha igreja
    (public.get_my_papel() = 'admin' AND igreja_id = public.get_my_igreja_id())
  )
  OR
  (
    -- Caso 2: Sou o próprio usuário
    (id = auth.uid())
  )
)
WITH CHECK (
  -- Após UPDATE, linha resultante deve satisfazer:
  (
    -- Caso 1a: Sou admin e o usuário continua na minha igreja
    (public.get_my_papel() = 'admin' AND igreja_id = public.get_my_igreja_id())
  )
  OR
  (
    -- Caso 1b: Sou admin e removi o usuário (igreja_id = NULL)
    (public.get_my_papel() = 'admin' AND igreja_id IS NULL)
  )
  OR
  (
    -- Caso 2: Sou o próprio usuário e mantenho minha igreja
    (id = auth.uid() AND igreja_id = public.get_my_igreja_id())
  )
);

-- =====================================================
-- PASSO 3: Comentários explicativos
-- =====================================================

COMMENT ON POLICY "usuarios_update_unified" ON public.usuarios IS
'Política unificada de UPDATE para usuarios:
- Admin pode editar/remover membros da sua igreja
- Usuários podem editar seus próprios dados (mas não trocar de igreja)';

-- =====================================================
-- VERIFICAÇÃO: Execute para confirmar
-- =====================================================

-- SELECT
--   policyname,
--   cmd,
--   qual::text as using_clause,
--   with_check::text as with_check_clause
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename = 'usuarios'
--   AND cmd = 'UPDATE';
