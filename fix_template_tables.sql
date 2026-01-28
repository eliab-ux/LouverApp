-- ==========================================
-- CORREÇÃO: Adicionar constraints UNIQUE nas tabelas de template
-- Execute este script no SQL Editor do projeto DEV
-- ==========================================

-- Adicionar UNIQUE constraint em template_categorias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'template_categorias_nome_key'
  ) THEN
    ALTER TABLE template_categorias ADD CONSTRAINT template_categorias_nome_key UNIQUE (nome);
  END IF;
END $$;

-- Adicionar UNIQUE constraint em template_momentos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'template_momentos_nome_key'
  ) THEN
    ALTER TABLE template_momentos ADD CONSTRAINT template_momentos_nome_key UNIQUE (nome);
  END IF;
END $$;

-- Adicionar UNIQUE constraint em template_estilos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'template_estilos_nome_key'
  ) THEN
    ALTER TABLE template_estilos ADD CONSTRAINT template_estilos_nome_key UNIQUE (nome);
  END IF;
END $$;

-- Adicionar coluna ordem se não existir
ALTER TABLE template_categorias ADD COLUMN IF NOT EXISTS ordem integer DEFAULT 0;
ALTER TABLE template_momentos ADD COLUMN IF NOT EXISTS ordem integer DEFAULT 0;
ALTER TABLE template_estilos ADD COLUMN IF NOT EXISTS ordem integer DEFAULT 0;

-- Agora popular os dados (com ON CONFLICT funcionando)
INSERT INTO template_categorias (nome, ordem) VALUES
  ('Adoração', 1),
  ('Celebração', 2),
  ('Intimidade', 3)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO template_momentos (nome, ordem) VALUES
  ('Abertura', 1),
  ('Adoração', 2),
  ('Oferta', 3),
  ('Ministração', 4)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO template_estilos (nome, ordem) VALUES
  ('Pop Rock', 1),
  ('Worship', 2),
  ('Gospel', 3)
ON CONFLICT (nome) DO NOTHING;

-- Adicionar UNIQUE constraint em tipos_evento
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tipos_evento_nome_key'
  ) THEN
    ALTER TABLE tipos_evento ADD CONSTRAINT tipos_evento_nome_key UNIQUE (nome);
  END IF;
END $$;

-- Popular tipos_evento (usando UPSERT manual se necessário)
INSERT INTO tipos_evento (id, nome, ordem)
SELECT '11111111-1111-1111-1111-111111111111', 'Culto', 1
WHERE NOT EXISTS (SELECT 1 FROM tipos_evento WHERE nome = 'Culto');

INSERT INTO tipos_evento (id, nome, ordem)
SELECT '22222222-2222-2222-2222-222222222222', 'Ensaio', 2
WHERE NOT EXISTS (SELECT 1 FROM tipos_evento WHERE nome = 'Ensaio');

-- ==========================================
-- PRONTO! Agora pode aplicar as migrations
-- ==========================================
