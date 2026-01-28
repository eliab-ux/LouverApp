-- =====================================================
-- Add slot column to escala_notificacao_log for reminders per day
-- =====================================================

ALTER TABLE public.escala_notificacao_log
  ADD COLUMN IF NOT EXISTS slot integer NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_escala_notificacao_log_slot
  ON public.escala_notificacao_log (escala_id, tipo, dia, slot);
