-- ========================================
-- MÓDULO DE ESCALA E AGENDA
-- Criação de Tabelas e Políticas RLS
-- ========================================
-- Execute este script no Supabase SQL Editor

-- ==========================================
-- 1. CRIAR TABELAS
-- ==========================================

-- Tabela: EVENTOS (Cultos e Ensaios)
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('culto', 'ensaio')),
  data DATE NOT NULL,
  hora TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(igreja_id, data, hora, tipo)
);

-- Tabela: ESCALAS (Escala por evento)
CREATE TABLE IF NOT EXISTS escalas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  publicada BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  criado_por UUID NOT NULL REFERENCES usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(evento_id)
);

-- Tabela: INDISPONIBILIDADES (Membro x Data)
CREATE TABLE IF NOT EXISTS indisponibilidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, data)
);

-- Tabela: ESCALADOS (Quem está na escala)
CREATE TABLE IF NOT EXISTS escalados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escala_id UUID NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  funcao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(escala_id, usuario_id, funcao)
);

-- ==========================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_eventos_igreja_data ON eventos(igreja_id, data);
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data);
CREATE INDEX IF NOT EXISTS idx_escalas_evento ON escalas(evento_id);
CREATE INDEX IF NOT EXISTS idx_escalas_igreja ON escalas(igreja_id);
CREATE INDEX IF NOT EXISTS idx_indisponibilidades_usuario ON indisponibilidades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_indisponibilidades_igreja_data ON indisponibilidades(igreja_id, data);
CREATE INDEX IF NOT EXISTS idx_escalados_escala ON escalados(escala_id);
CREATE INDEX IF NOT EXISTS idx_escalados_usuario ON escalados(usuario_id);

-- ==========================================
-- 3. ATIVAR RLS EM TODAS AS TABELAS
-- ==========================================

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE indisponibilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalados ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. POLÍTICAS RLS - EVENTOS
-- ==========================================

-- SELECT: Todos os membros da igreja
DROP POLICY IF EXISTS "Membros podem ver eventos da igreja" ON eventos;
CREATE POLICY "Membros podem ver eventos da igreja"
ON eventos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = eventos.igreja_id
  )
);

-- INSERT: Apenas líder/admin
DROP POLICY IF EXISTS "Lider pode criar eventos" ON eventos;
CREATE POLICY "Lider pode criar eventos"
ON eventos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = eventos.igreja_id
    AND usuarios.papel IN ('admin', 'lider')
  )
);

-- UPDATE: Apenas líder/admin
DROP POLICY IF EXISTS "Lider pode editar eventos" ON eventos;
CREATE POLICY "Lider pode editar eventos"
ON eventos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = eventos.igreja_id
    AND usuarios.papel IN ('admin', 'lider')
  )
);

-- DELETE: Apenas admin
DROP POLICY IF EXISTS "Admin pode deletar eventos" ON eventos;
CREATE POLICY "Admin pode deletar eventos"
ON eventos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = eventos.igreja_id
    AND usuarios.papel = 'admin'
  )
);

-- ==========================================
-- 5. POLÍTICAS RLS - ESCALAS
-- ==========================================

-- SELECT: Todos os membros da igreja
DROP POLICY IF EXISTS "Membros podem ver escalas da igreja" ON escalas;
CREATE POLICY "Membros podem ver escalas da igreja"
ON escalas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = escalas.igreja_id
  )
);

-- INSERT: Apenas líder/admin
DROP POLICY IF EXISTS "Lider pode criar escalas" ON escalas;
CREATE POLICY "Lider pode criar escalas"
ON escalas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = escalas.igreja_id
    AND usuarios.papel IN ('admin', 'lider')
  )
);

-- UPDATE: Apenas líder/admin
DROP POLICY IF EXISTS "Lider pode editar escalas" ON escalas;
CREATE POLICY "Lider pode editar escalas"
ON escalas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = escalas.igreja_id
    AND usuarios.papel IN ('admin', 'lider')
  )
);

-- DELETE: Apenas admin
DROP POLICY IF EXISTS "Admin pode deletar escalas" ON escalas;
CREATE POLICY "Admin pode deletar escalas"
ON escalas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = escalas.igreja_id
    AND usuarios.papel = 'admin'
  )
);

-- ==========================================
-- 6. POLÍTICAS RLS - INDISPONIBILIDADES
-- ==========================================

-- SELECT: Próprio usuário + líder/admin da igreja
DROP POLICY IF EXISTS "Usuario ve suas indisponibilidades" ON indisponibilidades;
CREATE POLICY "Usuario ve suas indisponibilidades"
ON indisponibilidades
FOR SELECT
TO authenticated
USING (
  usuario_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = indisponibilidades.igreja_id
    AND usuarios.papel IN ('admin', 'lider')
  )
);

-- INSERT: Apenas o próprio usuário (e data futura)
DROP POLICY IF EXISTS "Usuario pode marcar indisponibilidade" ON indisponibilidades;
CREATE POLICY "Usuario pode marcar indisponibilidade"
ON indisponibilidades
FOR INSERT
TO authenticated
WITH CHECK (
  usuario_id = auth.uid()
  AND data >= CURRENT_DATE
  AND EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = indisponibilidades.igreja_id
  )
);

-- UPDATE: Apenas o próprio usuário (se escala não publicada)
DROP POLICY IF EXISTS "Usuario pode editar sua indisponibilidade" ON indisponibilidades;
CREATE POLICY "Usuario pode editar sua indisponibilidade"
ON indisponibilidades
FOR UPDATE
TO authenticated
USING (
  usuario_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM escalas e
    JOIN eventos ev ON ev.id = e.evento_id
    WHERE ev.data = indisponibilidades.data
    AND e.igreja_id = indisponibilidades.igreja_id
    AND e.publicada = true
  )
);

-- DELETE: Apenas o próprio usuário (se escala não publicada)
DROP POLICY IF EXISTS "Usuario pode deletar sua indisponibilidade" ON indisponibilidades;
CREATE POLICY "Usuario pode deletar sua indisponibilidade"
ON indisponibilidades
FOR DELETE
TO authenticated
USING (
  usuario_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM escalas e
    JOIN eventos ev ON ev.id = e.evento_id
    WHERE ev.data = indisponibilidades.data
    AND e.igreja_id = indisponibilidades.igreja_id
    AND e.publicada = true
  )
);

-- ==========================================
-- 7. POLÍTICAS RLS - ESCALADOS
-- ==========================================

-- SELECT: Todos os membros da igreja
DROP POLICY IF EXISTS "Membros podem ver escalados da igreja" ON escalados;
CREATE POLICY "Membros podem ver escalados da igreja"
ON escalados
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM escalas e
    JOIN usuarios u ON u.igreja_id = e.igreja_id
    WHERE e.id = escalados.escala_id
    AND u.id = auth.uid()
  )
);

-- INSERT: Apenas líder/admin
DROP POLICY IF EXISTS "Lider pode escalar membros" ON escalados;
CREATE POLICY "Lider pode escalar membros"
ON escalados
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM escalas e
    JOIN usuarios u ON u.igreja_id = e.igreja_id
    WHERE e.id = escalados.escala_id
    AND u.id = auth.uid()
    AND u.papel IN ('admin', 'lider')
  )
);

-- UPDATE: Apenas líder/admin
DROP POLICY IF EXISTS "Lider pode editar escalados" ON escalados;
CREATE POLICY "Lider pode editar escalados"
ON escalados
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM escalas e
    JOIN usuarios u ON u.igreja_id = e.igreja_id
    WHERE e.id = escalados.escala_id
    AND u.id = auth.uid()
    AND u.papel IN ('admin', 'lider')
  )
);

-- DELETE: Apenas líder/admin
DROP POLICY IF EXISTS "Lider pode remover escalados" ON escalados;
CREATE POLICY "Lider pode remover escalados"
ON escalados
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM escalas e
    JOIN usuarios u ON u.igreja_id = e.igreja_id
    WHERE e.id = escalados.escala_id
    AND u.id = auth.uid()
    AND u.papel IN ('admin', 'lider')
  )
);

-- ==========================================
-- 8. TRIGGER PARA UPDATED_AT EM ESCALAS
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_escalas_updated_at ON escalas;
CREATE TRIGGER update_escalas_updated_at
  BEFORE UPDATE ON escalas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 9. VERIFICAÇÃO - Listar tabelas e políticas criadas
-- ==========================================

-- Verificar se as tabelas foram criadas
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('eventos', 'escalas', 'indisponibilidades', 'escalados')
ORDER BY tablename;

-- Listar políticas criadas
SELECT 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN policyname LIKE '%lider%' OR policyname LIKE '%Lider%' THEN 'Líder/Admin'
    WHEN policyname LIKE '%admin%' OR policyname LIKE '%Admin%' THEN 'Admin'
    WHEN policyname LIKE '%usuario%' OR policyname LIKE '%Usuario%' THEN 'Usuário'
    ELSE 'Membros'
  END as restricao
FROM pg_policies
WHERE tablename IN ('eventos', 'escalas', 'indisponibilidades', 'escalados')
ORDER BY tablename, cmd;

-- ==========================================
-- RESULTADO ESPERADO:
-- ==========================================
-- 4 tabelas criadas com RLS ativo
-- 16 políticas criadas (4 por tabela: SELECT, INSERT, UPDATE, DELETE)
-- Trigger de updated_at funcionando
