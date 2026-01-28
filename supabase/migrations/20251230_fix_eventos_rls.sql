-- =====================================================
-- Fix: Corrigir políticas RLS para tabela eventos
-- Data: 2025-12-30
-- =====================================================

-- PROBLEMA:
-- A tabela eventos tem políticas RLS, mas elas não estão
-- permitindo INSERT/UPDATE/DELETE corretamente.
-- Precisamos usar as funções get_my_papel() e get_my_igreja_id()

-- =====================================================
-- PASSO 1: Remover políticas antigas
-- =====================================================
DROP POLICY IF EXISTS "select_eventos" ON public.eventos;
DROP POLICY IF EXISTS "insert_eventos" ON public.eventos;
DROP POLICY IF EXISTS "update_eventos" ON public.eventos;
DROP POLICY IF EXISTS "delete_eventos" ON public.eventos;

-- =====================================================
-- PASSO 2: Criar políticas corretas
-- =====================================================

-- SELECT: Todos os membros da igreja podem ver eventos da sua igreja
CREATE POLICY "select_eventos" ON public.eventos
FOR SELECT
TO authenticated
USING (
  igreja_id = public.get_my_igreja_id()
);

-- INSERT: Apenas admin e líder podem criar eventos
CREATE POLICY "insert_eventos" ON public.eventos
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_papel() IN ('admin', 'lider')
  AND igreja_id = public.get_my_igreja_id()
);

-- UPDATE: Apenas admin e líder podem atualizar eventos da sua igreja
CREATE POLICY "update_eventos" ON public.eventos
FOR UPDATE
TO authenticated
USING (
  igreja_id = public.get_my_igreja_id()
  AND public.get_my_papel() IN ('admin', 'lider')
)
WITH CHECK (
  igreja_id = public.get_my_igreja_id()
  AND public.get_my_papel() IN ('admin', 'lider')
);

-- DELETE: Apenas admin pode deletar eventos
CREATE POLICY "delete_eventos" ON public.eventos
FOR DELETE
TO authenticated
USING (
  igreja_id = public.get_my_igreja_id()
  AND public.get_my_papel() = 'admin'
);

-- =====================================================
-- PASSO 3: Garantir que RLS está habilitado
-- =====================================================
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Comentários
-- =====================================================
COMMENT ON POLICY "select_eventos" ON public.eventos IS
'Membros podem ver eventos da sua igreja';

COMMENT ON POLICY "insert_eventos" ON public.eventos IS
'Apenas admin e líder podem criar eventos';

COMMENT ON POLICY "update_eventos" ON public.eventos IS
'Apenas admin e líder podem atualizar eventos';

COMMENT ON POLICY "delete_eventos" ON public.eventos IS
'Apenas admin pode deletar eventos';
