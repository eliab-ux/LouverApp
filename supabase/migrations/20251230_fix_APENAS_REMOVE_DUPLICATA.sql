-- =====================================================
-- Fix: Remover política duplicada que está bloqueando
-- Data: 2025-12-30
-- =====================================================

-- PROBLEMA ENCONTRADO:
-- Existem 2 políticas UPDATE:
--   1. usuarios_update_policy (correta, permite igreja_id = null)
--   2. update_meu_usuario (duplicada, bloqueia igreja_id = null)
--
-- Como AMBAS são PERMISSIVE, as duas precisam passar.
-- A política "update_meu_usuario" bloqueia porque:
--   WITH CHECK: (id = auth.uid()) AND (igreja_id = get_my_igreja_id())
--
-- Quando admin remove outro usuário, essa política falha.

-- SOLUÇÃO: Remover a política duplicada
DROP POLICY IF EXISTS "update_meu_usuario" ON public.usuarios;

-- Pronto! Agora só resta "usuarios_update_policy" que já cobre
-- todos os casos corretamente:
--   - Admin pode editar/remover membros da sua igreja
--   - Usuários podem editar seus próprios dados

-- =====================================================
-- VERIFICAÇÃO: Execute para confirmar
-- =====================================================

SELECT
  policyname,
  cmd,
  'UPDATE policy' as tipo
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'usuarios'
  AND cmd = 'UPDATE';

-- Deve retornar apenas 1 linha: usuarios_update_policy
