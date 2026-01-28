-- =====================================================
-- Fix: Corrigir políticas RLS para todas as tabelas de escala
-- Data: 2025-12-30
-- =====================================================

-- PROBLEMA:
-- As tabelas de escala (escalas, escalados, indisponibilidades, escala_musicas)
-- têm políticas com TO public mas sem validações corretas usando
-- get_my_papel() e get_my_igreja_id()

-- =====================================================
-- TABELA: escalas
-- =====================================================

DROP POLICY IF EXISTS "select_escalas" ON public.escalas;
DROP POLICY IF EXISTS "insert_escalas" ON public.escalas;
DROP POLICY IF EXISTS "update_escalas" ON public.escalas;
DROP POLICY IF EXISTS "delete_escalas" ON public.escalas;

-- SELECT: Todos os membros da igreja podem ver escalas
CREATE POLICY "select_escalas" ON public.escalas
FOR SELECT
TO authenticated
USING (
  igreja_id = public.get_my_igreja_id()
);

-- INSERT: Apenas admin e líder podem criar escalas
CREATE POLICY "insert_escalas" ON public.escalas
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_papel() IN ('admin', 'lider')
  AND igreja_id = public.get_my_igreja_id()
);

-- UPDATE: Apenas admin e líder podem atualizar escalas
CREATE POLICY "update_escalas" ON public.escalas
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

-- DELETE: Apenas admin pode deletar escalas
CREATE POLICY "delete_escalas" ON public.escalas
FOR DELETE
TO authenticated
USING (
  igreja_id = public.get_my_igreja_id()
  AND public.get_my_papel() = 'admin'
);

ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABELA: escalados
-- =====================================================

DROP POLICY IF EXISTS "select_escalados" ON public.escalados;
DROP POLICY IF EXISTS "insert_escalados" ON public.escalados;
DROP POLICY IF EXISTS "update_escalados" ON public.escalados;
DROP POLICY IF EXISTS "delete_escalados" ON public.escalados;

-- SELECT: Todos podem ver escalados (via join com escala que já filtra por igreja)
CREATE POLICY "select_escalados" ON public.escalados
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escalados.escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

-- INSERT: Apenas admin e líder podem adicionar escalados
CREATE POLICY "insert_escalados" ON public.escalados
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_papel() IN ('admin', 'lider')
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

-- UPDATE: Apenas admin e líder podem atualizar escalados
CREATE POLICY "update_escalados" ON public.escalados
FOR UPDATE
TO authenticated
USING (
  public.get_my_papel() IN ('admin', 'lider')
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escalados.escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
)
WITH CHECK (
  public.get_my_papel() IN ('admin', 'lider')
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

-- DELETE: Apenas admin e líder podem remover escalados
CREATE POLICY "delete_escalados" ON public.escalados
FOR DELETE
TO authenticated
USING (
  public.get_my_papel() IN ('admin', 'lider')
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escalados.escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

ALTER TABLE public.escalados ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABELA: indisponibilidades
-- =====================================================

DROP POLICY IF EXISTS "select_indisponibilidades" ON public.indisponibilidades;
DROP POLICY IF EXISTS "insert_indisponibilidades" ON public.indisponibilidades;
DROP POLICY IF EXISTS "update_indisponibilidades" ON public.indisponibilidades;
DROP POLICY IF EXISTS "delete_indisponibilidades" ON public.indisponibilidades;

-- SELECT: Usuário vê suas próprias indisponibilidades + admin/líder veem todas da igreja
CREATE POLICY "select_indisponibilidades" ON public.indisponibilidades
FOR SELECT
TO authenticated
USING (
  usuario_id = auth.uid()
  OR (
    public.get_my_papel() IN ('admin', 'lider')
    AND igreja_id = public.get_my_igreja_id()
  )
);

-- INSERT: Qualquer membro pode criar sua própria indisponibilidade
CREATE POLICY "insert_indisponibilidades" ON public.indisponibilidades
FOR INSERT
TO authenticated
WITH CHECK (
  usuario_id = auth.uid()
  AND igreja_id = public.get_my_igreja_id()
);

-- UPDATE: Usuário pode atualizar apenas suas próprias indisponibilidades
CREATE POLICY "update_indisponibilidades" ON public.indisponibilidades
FOR UPDATE
TO authenticated
USING (
  usuario_id = auth.uid()
  AND igreja_id = public.get_my_igreja_id()
)
WITH CHECK (
  usuario_id = auth.uid()
  AND igreja_id = public.get_my_igreja_id()
);

-- DELETE: Usuário pode deletar apenas suas próprias indisponibilidades
-- Admin/líder também podem deletar qualquer indisponibilidade da igreja
CREATE POLICY "delete_indisponibilidades" ON public.indisponibilidades
FOR DELETE
TO authenticated
USING (
  usuario_id = auth.uid()
  OR (
    public.get_my_papel() IN ('admin', 'lider')
    AND igreja_id = public.get_my_igreja_id()
  )
);

ALTER TABLE public.indisponibilidades ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABELA: escala_musicas
-- =====================================================

DROP POLICY IF EXISTS "select_escala_musicas" ON public.escala_musicas;
DROP POLICY IF EXISTS "insert_escala_musicas" ON public.escala_musicas;
DROP POLICY IF EXISTS "update_escala_musicas" ON public.escala_musicas;
DROP POLICY IF EXISTS "delete_escala_musicas" ON public.escala_musicas;

-- SELECT: Todos podem ver músicas da escala (via join com escala)
CREATE POLICY "select_escala_musicas" ON public.escala_musicas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_musicas.escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

-- INSERT: Apenas admin e líder podem adicionar músicas à escala
CREATE POLICY "insert_escala_musicas" ON public.escala_musicas
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_papel() IN ('admin', 'lider')
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

-- UPDATE: Apenas admin e líder podem atualizar músicas da escala
CREATE POLICY "update_escala_musicas" ON public.escala_musicas
FOR UPDATE
TO authenticated
USING (
  public.get_my_papel() IN ('admin', 'lider')
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_musicas.escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
)
WITH CHECK (
  public.get_my_papel() IN ('admin', 'lider')
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

-- DELETE: Apenas admin e líder podem remover músicas da escala
CREATE POLICY "delete_escala_musicas" ON public.escala_musicas
FOR DELETE
TO authenticated
USING (
  public.get_my_papel() IN ('admin', 'lider')
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_musicas.escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

ALTER TABLE public.escala_musicas ENABLE ROW LEVEL SECURITY;
