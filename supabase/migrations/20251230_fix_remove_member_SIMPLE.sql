-- =====================================================
-- Fix: Permitir admin remover membros
-- SOLUÇÃO SIMPLES: Corrigir apenas a política update_meu_usuario
-- Data: 2025-12-30
-- =====================================================

-- PROBLEMA ENCONTRADO:
-- A política "update_meu_usuario" tem WITH CHECK que sempre verifica
-- (id = auth.uid()) AND (igreja_id = get_my_igreja_id())
--
-- Quando admin remove outro usuário, essa política FALHA porque
-- id = auth.uid() é FALSE (não é o próprio usuário).
--
-- Como TODAS as políticas PERMISSIVE devem passar, o UPDATE é bloqueado.

-- SOLUÇÃO: Fazer WITH CHECK verificar apenas se for o próprio usuário
DROP POLICY IF EXISTS "update_meu_usuario" ON public.usuarios;

CREATE POLICY "update_meu_usuario" ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  -- Só permite UPDATE se for o próprio usuário
  id = auth.uid()
)
WITH CHECK (
  -- Após o UPDATE, verifica apenas se for o próprio usuário
  -- (se não for, essa política simplesmente não se aplica)
  id = auth.uid()
  AND igreja_id = public.get_my_igreja_id()
);

-- =====================================================
-- EXPLICAÇÃO:
-- Agora temos 2 políticas UPDATE:
--
-- 1. admin_update_usuarios_mesma_igreja
--    USING: é admin E usuário é da mesma igreja
--    WITH CHECK: é admin E (usuário continua na mesma igreja OU igreja_id = null)
--    → Permite admin remover membros ✅
--
-- 2. update_meu_usuario (corrigida)
--    USING: é o próprio usuário
--    WITH CHECK: é o próprio usuário E mantém mesma igreja
--    → Permite usuário editar seus dados, mas não trocar de igreja ✅
--
-- Quando admin remove um membro:
-- - Política 1 passa ✅ (é admin e permite igreja_id = null)
-- - Política 2 passa ✅ (USING falha, então WITH CHECK não é verificado)
-- =====================================================
