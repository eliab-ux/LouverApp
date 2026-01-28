-- =====================================================
-- Fix: Permitir admin remover membros (setar igreja_id = null)
-- Data: 2025-12-30
-- Problema: Política USING bloqueava UPDATE quando igreja_id
--           da linha era igual à igreja do admin, mas o WITH CHECK
--           permitia igreja_id = null. Isso causava conflito.
-- Solução: Ajustar a cláusula USING para permitir a remoção.
-- =====================================================

-- Drop a política existente
DROP POLICY IF EXISTS "admin_update_usuarios_mesma_igreja" ON public.usuarios;

-- Recriar com USING corrigido
CREATE POLICY "admin_update_usuarios_mesma_igreja" ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  -- Admin pode editar membros da sua igreja OU membros que estão sendo removidos
  public.get_my_papel() = 'admin'
  AND (
    igreja_id = public.get_my_igreja_id()  -- Membro da mesma igreja
    OR igreja_id IS NULL                   -- Ou já foi removido
  )
)
WITH CHECK (
  -- Após o update, pode ficar com igreja_id igual à do admin ou null (removido)
  public.get_my_papel() = 'admin'
  AND (
    igreja_id = public.get_my_igreja_id()  -- Continua na mesma igreja
    OR igreja_id IS NULL                   -- Ou foi removido
  )
);

-- =====================================================
-- Política adicional: Remover a política duplicada se existir
-- =====================================================
DROP POLICY IF EXISTS "admin_can_remove_member_set_igreja_null" ON public.usuarios;
