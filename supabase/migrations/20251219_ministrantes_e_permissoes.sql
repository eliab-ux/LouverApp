ALTER TABLE escalados ADD COLUMN IF NOT EXISTS is_ministrante BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.check_escala_tem_ministrante()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.publicada = true AND OLD.publicada IS DISTINCT FROM true THEN
    IF NOT EXISTS (
      SELECT 1
      FROM escalados
      WHERE escala_id = NEW.id
      AND is_ministrante = true
    ) THEN
      RAISE EXCEPTION 'Escala precisa ter ao menos um ministrante antes de publicar.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_escalas_ministrante ON escalas;
CREATE TRIGGER trg_escalas_ministrante
BEFORE UPDATE OF publicada ON escalas
FOR EACH ROW
EXECUTE FUNCTION public.check_escala_tem_ministrante();

DROP POLICY IF EXISTS escala_musicas_insert ON escala_musicas;
DROP POLICY IF EXISTS escala_musicas_update ON escala_musicas;
DROP POLICY IF EXISTS escala_musicas_delete ON escala_musicas;

CREATE POLICY escala_musicas_insert ON escala_musicas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM escalas e
    JOIN usuarios u ON u.id = auth.uid() AND u.igreja_id = e.igreja_id
    WHERE e.id = escala_musicas.escala_id
    AND (
      u.papel IN ('admin', 'lider')
      OR EXISTS (
        SELECT 1
        FROM escalados es
        WHERE es.escala_id = e.id
        AND es.usuario_id = auth.uid()
        AND es.is_ministrante = true
      )
    )
  )
);

CREATE POLICY escala_musicas_update ON escala_musicas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM escalas e
    JOIN usuarios u ON u.id = auth.uid() AND u.igreja_id = e.igreja_id
    WHERE e.id = escala_musicas.escala_id
    AND (
      u.papel IN ('admin', 'lider')
      OR EXISTS (
        SELECT 1
        FROM escalados es
        WHERE es.escala_id = e.id
        AND es.usuario_id = auth.uid()
        AND es.is_ministrante = true
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM escalas e
    JOIN usuarios u ON u.id = auth.uid() AND u.igreja_id = e.igreja_id
    WHERE e.id = escala_musicas.escala_id
    AND (
      u.papel IN ('admin', 'lider')
      OR EXISTS (
        SELECT 1
        FROM escalados es
        WHERE es.escala_id = e.id
        AND es.usuario_id = auth.uid()
        AND es.is_ministrante = true
      )
    )
  )
);

CREATE POLICY escala_musicas_delete ON escala_musicas
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM escalas e
    JOIN usuarios u ON u.id = auth.uid() AND u.igreja_id = e.igreja_id
    WHERE e.id = escala_musicas.escala_id
    AND (
      u.papel IN ('admin', 'lider')
      OR EXISTS (
        SELECT 1
        FROM escalados es
        WHERE es.escala_id = e.id
        AND es.usuario_id = auth.uid()
        AND es.is_ministrante = true
      )
    )
  )
);
