CREATE TABLE IF NOT EXISTS configuracao_notificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  dias_antes INTEGER NOT NULL DEFAULT 3,
  alertas_por_dia INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(igreja_id)
);

CREATE TABLE IF NOT EXISTS escala_notificacao_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escala_id UUID NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('missing_musicas')),
  dia DATE NOT NULL DEFAULT CURRENT_DATE,
  slot INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(escala_id, tipo, dia, slot)
);

ALTER TABLE configuracao_notificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE escala_notificacao_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_notificacao_select" ON configuracao_notificacao;
CREATE POLICY "config_notificacao_select"
ON configuracao_notificacao
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = configuracao_notificacao.igreja_id
    AND usuarios.papel IN ('admin', 'lider')
  )
);

DROP POLICY IF EXISTS "config_notificacao_upsert" ON configuracao_notificacao;
CREATE POLICY "config_notificacao_upsert"
ON configuracao_notificacao
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = configuracao_notificacao.igreja_id
    AND usuarios.papel IN ('admin', 'lider')
  )
);

DROP POLICY IF EXISTS "config_notificacao_update" ON configuracao_notificacao;
CREATE POLICY "config_notificacao_update"
ON configuracao_notificacao
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = configuracao_notificacao.igreja_id
    AND usuarios.papel IN ('admin', 'lider')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = configuracao_notificacao.igreja_id
    AND usuarios.papel IN ('admin', 'lider')
  )
);

DROP POLICY IF EXISTS "escala_notificacao_log_select" ON escala_notificacao_log;
CREATE POLICY "escala_notificacao_log_select"
ON escala_notificacao_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = escala_notificacao_log.igreja_id
    AND usuarios.papel IN ('admin', 'lider')
  )
);

DROP POLICY IF EXISTS "escala_notificacao_log_insert" ON escala_notificacao_log;
CREATE POLICY "escala_notificacao_log_insert"
ON escala_notificacao_log
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = escala_notificacao_log.igreja_id
    AND usuarios.papel IN ('admin', 'lider')
  )
);

DROP TRIGGER IF EXISTS update_config_notificacao_updated_at ON configuracao_notificacao;
CREATE TRIGGER update_config_notificacao_updated_at
  BEFORE UPDATE ON configuracao_notificacao
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
