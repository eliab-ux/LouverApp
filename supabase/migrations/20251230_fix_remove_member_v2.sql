-- =====================================================
-- Fix: Permitir admin remover membros (setar igreja_id = null)
-- Versão 2 - Corrigindo WITH CHECK em TODAS as políticas UPDATE
-- Data: 2025-12-30
-- =====================================================

-- Problema identificado: Múltiplas políticas UPDATE conflitantes
-- O erro "new row violates row-level security policy" indica
-- que uma política WITH CHECK está rejeitando igreja_id = null

-- =====================================================
-- PASSO 1: Remover TODAS as políticas UPDATE antigas
-- =====================================================
DROP POLICY IF EXISTS "admin_update_usuarios_mesma_igreja" ON public.usuarios;
DROP POLICY IF EXISTS "admin_can_remove_member_set_igreja_null" ON public.usuarios;
DROP POLICY IF EXISTS "update_meu_usuario" ON public.usuarios;

-- =====================================================
-- PASSO 2: Criar políticas UPDATE corrigidas
-- =====================================================

-- Política 1: Admin pode editar membros da sua igreja (incluindo remover)
CREATE POLICY "admin_update_usuarios_mesma_igreja" ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  -- Verifica se é admin e se o usuário pertence à sua igreja
  public.get_my_papel() = 'admin'
  AND igreja_id = public.get_my_igreja_id()
)
WITH CHECK (
  -- Após o update, permite:
  -- 1. Manter na mesma igreja
  -- 2. Remover da igreja (igreja_id = null)
  public.get_my_papel() = 'admin'
  AND (
    igreja_id = public.get_my_igreja_id()
    OR igreja_id IS NULL
  )
);

-- Política 2: Usuário pode atualizar seus próprios dados
-- (mas não pode mudar sua igreja_id)
CREATE POLICY "update_meu_usuario" ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
  -- Usuário não pode se auto-remover da igreja ou trocar de igreja
  AND igreja_id = public.get_my_igreja_id()
);

-- =====================================================
-- PASSO 3: Verificar se há outras políticas que possam
--          estar bloqueando. Listar todas as políticas:
-- =====================================================

-- Execute este SELECT separadamente para debug:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'usuarios';
