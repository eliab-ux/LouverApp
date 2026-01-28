-- =====================================================
-- FIX COMPLETO: Corrigir TODAS as políticas RLS
-- Data: 2025-12-30
-- =====================================================

-- Este script consolida todas as correções de RLS necessárias.
-- Execute-o de uma vez para resolver todos os problemas de permissão.

-- =====================================================
-- ETAPA 1: Garantir que as funções helper existem
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

CREATE OR REPLACE FUNCTION public.get_my_papel()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT papel::text FROM public.usuarios WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_my_igreja_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_papel() TO authenticated;

-- =====================================================
-- ETAPA 2: EVENTOS - Políticas RLS
-- =====================================================

DROP POLICY IF EXISTS "select_eventos" ON public.eventos;
DROP POLICY IF EXISTS "insert_eventos" ON public.eventos;
DROP POLICY IF EXISTS "update_eventos" ON public.eventos;
DROP POLICY IF EXISTS "delete_eventos" ON public.eventos;

CREATE POLICY "select_eventos" ON public.eventos
FOR SELECT TO authenticated
USING (igreja_id = public.get_my_igreja_id());

CREATE POLICY "insert_eventos" ON public.eventos
FOR INSERT TO authenticated
WITH CHECK (
  public.get_my_papel() IN ('admin', 'lider')
  AND igreja_id = public.get_my_igreja_id()
);

CREATE POLICY "update_eventos" ON public.eventos
FOR UPDATE TO authenticated
USING (
  igreja_id = public.get_my_igreja_id()
  AND public.get_my_papel() IN ('admin', 'lider')
)
WITH CHECK (
  igreja_id = public.get_my_igreja_id()
  AND public.get_my_papel() IN ('admin', 'lider')
);

CREATE POLICY "delete_eventos" ON public.eventos
FOR DELETE TO authenticated
USING (
  igreja_id = public.get_my_igreja_id()
  AND public.get_my_papel() = 'admin'
);

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ETAPA 3: ESCALAS - Políticas RLS
-- =====================================================

DROP POLICY IF EXISTS "select_escalas" ON public.escalas;
DROP POLICY IF EXISTS "insert_escalas" ON public.escalas;
DROP POLICY IF EXISTS "update_escalas" ON public.escalas;
DROP POLICY IF EXISTS "delete_escalas" ON public.escalas;

CREATE POLICY "select_escalas" ON public.escalas
FOR SELECT TO authenticated
USING (igreja_id = public.get_my_igreja_id());

CREATE POLICY "insert_escalas" ON public.escalas
FOR INSERT TO authenticated
WITH CHECK (
  public.get_my_papel() IN ('admin', 'lider')
  AND igreja_id = public.get_my_igreja_id()
);

CREATE POLICY "update_escalas" ON public.escalas
FOR UPDATE TO authenticated
USING (
  igreja_id = public.get_my_igreja_id()
  AND public.get_my_papel() IN ('admin', 'lider')
)
WITH CHECK (
  igreja_id = public.get_my_igreja_id()
  AND public.get_my_papel() IN ('admin', 'lider')
);

CREATE POLICY "delete_escalas" ON public.escalas
FOR DELETE TO authenticated
USING (
  igreja_id = public.get_my_igreja_id()
  AND public.get_my_papel() = 'admin'
);

ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ETAPA 4: ESCALADOS - Políticas RLS
-- =====================================================

DROP POLICY IF EXISTS "select_escalados" ON public.escalados;
DROP POLICY IF EXISTS "insert_escalados" ON public.escalados;
DROP POLICY IF EXISTS "update_escalados" ON public.escalados;
DROP POLICY IF EXISTS "delete_escalados" ON public.escalados;

CREATE POLICY "select_escalados" ON public.escalados
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escalados.escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

CREATE POLICY "insert_escalados" ON public.escalados
FOR INSERT TO authenticated
WITH CHECK (
  public.get_my_papel() IN ('admin', 'lider')
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

CREATE POLICY "update_escalados" ON public.escalados
FOR UPDATE TO authenticated
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

CREATE POLICY "delete_escalados" ON public.escalados
FOR DELETE TO authenticated
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
-- ETAPA 5: INDISPONIBILIDADES - Políticas RLS
-- =====================================================

DROP POLICY IF EXISTS "select_indisponibilidades" ON public.indisponibilidades;
DROP POLICY IF EXISTS "insert_indisponibilidades" ON public.indisponibilidades;
DROP POLICY IF EXISTS "update_indisponibilidades" ON public.indisponibilidades;
DROP POLICY IF EXISTS "delete_indisponibilidades" ON public.indisponibilidades;

CREATE POLICY "select_indisponibilidades" ON public.indisponibilidades
FOR SELECT TO authenticated
USING (
  usuario_id = auth.uid()
  OR (
    public.get_my_papel() IN ('admin', 'lider')
    AND igreja_id = public.get_my_igreja_id()
  )
);

CREATE POLICY "insert_indisponibilidades" ON public.indisponibilidades
FOR INSERT TO authenticated
WITH CHECK (
  usuario_id = auth.uid()
  AND igreja_id = public.get_my_igreja_id()
);

CREATE POLICY "update_indisponibilidades" ON public.indisponibilidades
FOR UPDATE TO authenticated
USING (
  usuario_id = auth.uid()
  AND igreja_id = public.get_my_igreja_id()
)
WITH CHECK (
  usuario_id = auth.uid()
  AND igreja_id = public.get_my_igreja_id()
);

CREATE POLICY "delete_indisponibilidades" ON public.indisponibilidades
FOR DELETE TO authenticated
USING (
  usuario_id = auth.uid()
  OR (
    public.get_my_papel() IN ('admin', 'lider')
    AND igreja_id = public.get_my_igreja_id()
  )
);

ALTER TABLE public.indisponibilidades ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ETAPA 6: ESCALA_MUSICAS - Políticas RLS
-- =====================================================

DROP POLICY IF EXISTS "select_escala_musicas" ON public.escala_musicas;
DROP POLICY IF EXISTS "insert_escala_musicas" ON public.escala_musicas;
DROP POLICY IF EXISTS "update_escala_musicas" ON public.escala_musicas;
DROP POLICY IF EXISTS "delete_escala_musicas" ON public.escala_musicas;

CREATE POLICY "select_escala_musicas" ON public.escala_musicas
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_musicas.escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

CREATE POLICY "insert_escala_musicas" ON public.escala_musicas
FOR INSERT TO authenticated
WITH CHECK (
  public.get_my_papel() IN ('admin', 'lider')
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

CREATE POLICY "update_escala_musicas" ON public.escala_musicas
FOR UPDATE TO authenticated
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

CREATE POLICY "delete_escala_musicas" ON public.escala_musicas
FOR DELETE TO authenticated
USING (
  public.get_my_papel() IN ('admin', 'lider')
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_musicas.escala_id
    AND escalas.igreja_id = public.get_my_igreja_id()
  )
);

ALTER TABLE public.escala_musicas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ETAPA 7: USUARIOS - Política unificada (já corrigida antes)
-- =====================================================

DROP POLICY IF EXISTS "admin_update_usuarios_mesma_igreja" ON public.usuarios;
DROP POLICY IF EXISTS "update_meu_usuario" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON public.usuarios;

CREATE POLICY "usuarios_update_policy" ON public.usuarios
FOR UPDATE TO authenticated
USING (
  (public.get_my_papel() = 'admin' AND igreja_id = public.get_my_igreja_id())
  OR (id = auth.uid())
)
WITH CHECK (
  (public.get_my_papel() = 'admin' AND igreja_id = public.get_my_igreja_id())
  OR (public.get_my_papel() = 'admin' AND igreja_id IS NULL)
  OR (id = auth.uid() AND igreja_id = public.get_my_igreja_id())
);

-- =====================================================
-- FIM - Todas as políticas RLS corrigidas!
-- =====================================================

-- Verificar políticas criadas:
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('eventos', 'escalas', 'escalados', 'indisponibilidades', 'escala_musicas', 'usuarios')
-- ORDER BY tablename, cmd;
