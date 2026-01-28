-- =====================================================
-- Fix: Permitir admin remover membros (setar igreja_id = null)
-- Versão 3 - SOLUÇÃO DEFINITIVA
-- Data: 2025-12-30
-- =====================================================

-- PROBLEMA IDENTIFICADO:
-- No PostgreSQL com RLS, quando há múltiplas políticas para UPDATE,
-- TODAS devem passar (comportamento AND, não OR).
-- Se qualquer WITH CHECK falhar, o UPDATE é bloqueado.

-- SOLUÇÃO:
-- Usar políticas PERMISSIVE separadas para cada caso de uso,
-- garantindo que cada uma permite seu próprio cenário.

-- =====================================================
-- PASSO 1: Limpar TODAS as políticas UPDATE existentes
-- =====================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'usuarios'
      AND cmd = 'UPDATE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.usuarios', pol.policyname);
  END LOOP;
END $$;

-- =====================================================
-- PASSO 2: Criar política ÚNICA para UPDATE
-- =====================================================

-- Política unificada: Cobre todos os casos de UPDATE
CREATE POLICY "usuarios_update_policy" ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  -- Permite UPDATE se qualquer uma dessas condições for verdadeira:
  (
    -- Caso 1: Admin editando membros da sua igreja
    (public.get_my_papel() = 'admin' AND igreja_id = public.get_my_igreja_id())
    OR
    -- Caso 2: Usuário editando seus próprios dados
    (id = auth.uid())
  )
)
WITH CHECK (
  -- Após o UPDATE, permite se qualquer uma dessas condições for verdadeira:
  (
    -- Caso 1: Admin mantendo membro na mesma igreja
    (public.get_my_papel() = 'admin' AND igreja_id = public.get_my_igreja_id())
    OR
    -- Caso 2: Admin removendo membro (igreja_id = null)
    (public.get_my_papel() = 'admin' AND igreja_id IS NULL)
    OR
    -- Caso 3: Usuário mantendo seus dados na mesma igreja
    (id = auth.uid() AND igreja_id = public.get_my_igreja_id())
  )
);

-- =====================================================
-- PASSO 3: Verificação (rode separadamente para debug)
-- =====================================================

-- SELECT
--   policyname,
--   cmd,
--   qual as using_clause,
--   with_check as with_check_clause
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'usuarios' AND cmd = 'UPDATE';
