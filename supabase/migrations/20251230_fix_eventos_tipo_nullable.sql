-- =====================================================
-- Fix: Tornar coluna 'tipo' nullable em eventos
-- Data: 2025-12-30
-- =====================================================

-- PROBLEMA:
-- A coluna eventos.tipo ainda é NOT NULL, mas agora usamos tipo_evento_id.
-- Isso causa erro 400 ao tentar criar eventos sem enviar a coluna 'tipo'.

-- SOLUÇÃO:
-- Tornar a coluna 'tipo' nullable (opcional) para compatibilidade com o novo modelo.

-- =====================================================
-- PASSO 1: Remover constraint CHECK antiga
-- =====================================================
ALTER TABLE public.eventos
  DROP CONSTRAINT IF EXISTS eventos_tipo_check;

-- =====================================================
-- PASSO 2: Tornar coluna 'tipo' NULLABLE
-- =====================================================
ALTER TABLE public.eventos
  ALTER COLUMN tipo DROP NOT NULL;

-- =====================================================
-- PASSO 3: (Opcional) Backfill para garantir dados consistentes
-- Preencher 'tipo' baseado em 'tipo_evento_id' para registros antigos
-- =====================================================
UPDATE public.eventos
SET tipo = 'culto'
WHERE tipo IS NULL
  AND tipo_evento_id = '11111111-1111-1111-1111-111111111111';

UPDATE public.eventos
SET tipo = 'ensaio'
WHERE tipo IS NULL
  AND tipo_evento_id = '22222222-2222-2222-2222-222222222222';

-- =====================================================
-- COMENTÁRIO
-- =====================================================
COMMENT ON COLUMN public.eventos.tipo IS
'Coluna legada de tipo de evento (mantida por compatibilidade). Use tipo_evento_id para novos registros.';

COMMENT ON COLUMN public.eventos.tipo_evento_id IS
'FK para tipos_evento. Substitui a coluna tipo (legada).';
