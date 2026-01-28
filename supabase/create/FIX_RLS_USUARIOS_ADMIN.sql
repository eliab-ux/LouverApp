-- ===========================================
-- CORRIGE RLS DE TODAS AS TABELAS
-- Usa função SECURITY DEFINER para evitar recursão
-- ===========================================

-- ==========================================
-- 1. CRIAR FUNÇÃO AUXILIAR (evita recursão)
-- ==========================================
CREATE OR REPLACE FUNCTION get_my_igreja_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT igreja_id FROM usuarios WHERE id = auth.uid()
$$;

-- ==========================================
-- 2. CORRIGIR RLS DA TABELA USUARIOS
-- ==========================================
DROP POLICY IF EXISTS "select_meu_usuario" ON usuarios;
DROP POLICY IF EXISTS "select_usuarios_mesma_igreja" ON usuarios;
DROP POLICY IF EXISTS "update_meu_usuario" ON usuarios;
DROP POLICY IF EXISTS "update_usuarios" ON usuarios;
DROP POLICY IF EXISTS "insert_usuarios" ON usuarios;

CREATE POLICY "select_usuarios_mesma_igreja" ON usuarios
  FOR SELECT USING (igreja_id = get_my_igreja_id());

CREATE POLICY "update_meu_usuario" ON usuarios
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "insert_usuarios" ON usuarios
  FOR INSERT WITH CHECK (true);

-- ==========================================
-- 3. CORRIGIR RLS DA TABELA EVENTOS
-- ==========================================
DROP POLICY IF EXISTS "Membros podem ver eventos da igreja" ON eventos;
DROP POLICY IF EXISTS "Lider pode criar eventos" ON eventos;
DROP POLICY IF EXISTS "Lider pode editar eventos" ON eventos;
DROP POLICY IF EXISTS "Admin pode deletar eventos" ON eventos;

CREATE POLICY "select_eventos" ON eventos
  FOR SELECT USING (igreja_id = get_my_igreja_id());

CREATE POLICY "insert_eventos" ON eventos
  FOR INSERT WITH CHECK (igreja_id = get_my_igreja_id());

CREATE POLICY "update_eventos" ON eventos
  FOR UPDATE USING (igreja_id = get_my_igreja_id());

CREATE POLICY "delete_eventos" ON eventos
  FOR DELETE USING (igreja_id = get_my_igreja_id());

-- ==========================================
-- 4. CORRIGIR RLS DA TABELA ESCALAS
-- ==========================================
DROP POLICY IF EXISTS "Membros podem ver escalas da igreja" ON escalas;
DROP POLICY IF EXISTS "Lider pode criar escalas" ON escalas;
DROP POLICY IF EXISTS "Lider pode editar escalas" ON escalas;
DROP POLICY IF EXISTS "Admin pode deletar escalas" ON escalas;

CREATE POLICY "select_escalas" ON escalas
  FOR SELECT USING (igreja_id = get_my_igreja_id());

CREATE POLICY "insert_escalas" ON escalas
  FOR INSERT WITH CHECK (igreja_id = get_my_igreja_id());

CREATE POLICY "update_escalas" ON escalas
  FOR UPDATE USING (igreja_id = get_my_igreja_id());

CREATE POLICY "delete_escalas" ON escalas
  FOR DELETE USING (igreja_id = get_my_igreja_id());

-- ==========================================
-- 5. CORRIGIR RLS DA TABELA ESCALADOS
-- ==========================================
DROP POLICY IF EXISTS "Membros podem ver escalados da igreja" ON escalados;
DROP POLICY IF EXISTS "Lider pode escalar membros" ON escalados;
DROP POLICY IF EXISTS "Lider pode editar escalados" ON escalados;
DROP POLICY IF EXISTS "Lider pode remover escalados" ON escalados;

-- SELECT: usuário pode ver escalados onde ele está OU da mesma igreja
CREATE POLICY "select_escalados" ON escalados
  FOR SELECT USING (
    usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM escalas 
      WHERE escalas.id = escalados.escala_id 
      AND escalas.igreja_id = get_my_igreja_id()
    )
  );

CREATE POLICY "insert_escalados" ON escalados
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM escalas 
      WHERE escalas.id = escala_id 
      AND escalas.igreja_id = get_my_igreja_id()
    )
  );

CREATE POLICY "update_escalados" ON escalados
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM escalas 
      WHERE escalas.id = escalados.escala_id 
      AND escalas.igreja_id = get_my_igreja_id()
    )
  );

CREATE POLICY "delete_escalados" ON escalados
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM escalas 
      WHERE escalas.id = escalados.escala_id 
      AND escalas.igreja_id = get_my_igreja_id()
    )
  );

-- ==========================================
-- 6. CORRIGIR RLS DA TABELA INDISPONIBILIDADES
-- ==========================================
DROP POLICY IF EXISTS "Usuario ve suas indisponibilidades" ON indisponibilidades;
DROP POLICY IF EXISTS "Usuario pode marcar indisponibilidade" ON indisponibilidades;
DROP POLICY IF EXISTS "Usuario pode editar sua indisponibilidade" ON indisponibilidades;
DROP POLICY IF EXISTS "Usuario pode deletar sua indisponibilidade" ON indisponibilidades;

CREATE POLICY "select_indisponibilidades" ON indisponibilidades
  FOR SELECT USING (
    usuario_id = auth.uid() 
    OR igreja_id = get_my_igreja_id()
  );

CREATE POLICY "insert_indisponibilidades" ON indisponibilidades
  FOR INSERT WITH CHECK (
    usuario_id = auth.uid() 
    AND igreja_id = get_my_igreja_id()
  );

CREATE POLICY "update_indisponibilidades" ON indisponibilidades
  FOR UPDATE USING (usuario_id = auth.uid());

CREATE POLICY "delete_indisponibilidades" ON indisponibilidades
  FOR DELETE USING (usuario_id = auth.uid());

-- ==========================================
-- 7. CORRIGIR RLS DA TABELA ESCALA_MUSICAS
-- ==========================================
DROP POLICY IF EXISTS "escala_musicas_select" ON escala_musicas;
DROP POLICY IF EXISTS "escala_musicas_insert" ON escala_musicas;
DROP POLICY IF EXISTS "escala_musicas_update" ON escala_musicas;
DROP POLICY IF EXISTS "escala_musicas_delete" ON escala_musicas;

CREATE POLICY "select_escala_musicas" ON escala_musicas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM escalas 
      WHERE escalas.id = escala_musicas.escala_id 
      AND escalas.igreja_id = get_my_igreja_id()
    )
  );

CREATE POLICY "insert_escala_musicas" ON escala_musicas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM escalas 
      WHERE escalas.id = escala_id 
      AND escalas.igreja_id = get_my_igreja_id()
    )
  );

CREATE POLICY "update_escala_musicas" ON escala_musicas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM escalas 
      WHERE escalas.id = escala_musicas.escala_id 
      AND escalas.igreja_id = get_my_igreja_id()
    )
  );

CREATE POLICY "delete_escala_musicas" ON escala_musicas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM escalas 
      WHERE escalas.id = escala_musicas.escala_id 
      AND escalas.igreja_id = get_my_igreja_id()
    )
  );

-- ==========================================
-- 8. VERIFICAR POLÍTICAS CRIADAS
-- ==========================================
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('usuarios', 'eventos', 'escalas', 'escalados', 'indisponibilidades', 'escala_musicas')
ORDER BY tablename, cmd;
