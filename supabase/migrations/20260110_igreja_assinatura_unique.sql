-- =====================================================
-- Unique constraint for upsert (igreja_id + plataforma)
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_igreja_assinatura_unique
  ON public.igreja_assinatura(igreja_id, plataforma);
