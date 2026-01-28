-- Tabela para armazenar as músicas selecionadas para cada escala
CREATE TABLE IF NOT EXISTS escala_musicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escala_id UUID NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
  musica_id UUID NOT NULL REFERENCES musicas(id) ON DELETE CASCADE,
  tom_escolhido TEXT, -- Tom escolhido para tocar a música neste evento
  ordem INTEGER DEFAULT 0, -- Ordem da música na escala
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evita duplicar a mesma música na mesma escala
  UNIQUE(escala_id, musica_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_escala_musicas_escala_id ON escala_musicas(escala_id);
CREATE INDEX IF NOT EXISTS idx_escala_musicas_musica_id ON escala_musicas(musica_id);

-- RLS (Row Level Security)
ALTER TABLE escala_musicas ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: todos da igreja podem ver
CREATE POLICY "escala_musicas_select" ON escala_musicas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM escalas e
      JOIN usuarios u ON u.igreja_id = e.igreja_id
      WHERE e.id = escala_musicas.escala_id
      AND u.id = auth.uid()
    )
  );

-- Política de INSERT: apenas admin e líder podem inserir
CREATE POLICY "escala_musicas_insert" ON escala_musicas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escalas e
      JOIN usuarios u ON u.igreja_id = e.igreja_id
      WHERE e.id = escala_musicas.escala_id
      AND u.id = auth.uid()
      AND u.papel IN ('admin', 'lider')
    )
  );

-- Política de UPDATE: apenas admin e líder podem atualizar
CREATE POLICY "escala_musicas_update" ON escala_musicas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM escalas e
      JOIN usuarios u ON u.igreja_id = e.igreja_id
      WHERE e.id = escala_musicas.escala_id
      AND u.id = auth.uid()
      AND u.papel IN ('admin', 'lider')
    )
  );

-- Política de DELETE: apenas admin e líder podem deletar
CREATE POLICY "escala_musicas_delete" ON escala_musicas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM escalas e
      JOIN usuarios u ON u.igreja_id = e.igreja_id
      WHERE e.id = escala_musicas.escala_id
      AND u.id = auth.uid()
      AND u.papel IN ('admin', 'lider')
    )
  );

-- Verificar estrutura
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'escala_musicas'
ORDER BY ordinal_position;
