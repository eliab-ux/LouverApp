-- =====================================================
-- SCRIPT: Templates para novas igrejas
-- Cria tabelas de template e popula com valores padrão
-- =====================================================

-- Adiciona coluna CNPJ na tabela igrejas (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'igrejas' AND column_name = 'cnpj'
  ) THEN
    ALTER TABLE igrejas ADD COLUMN cnpj text;
  END IF;
END $$;

-- Cria índice único para CNPJ (evita duplicatas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_igrejas_cnpj ON igrejas(cnpj) WHERE cnpj IS NOT NULL;

-- 1. Tabela de template de categorias
CREATE TABLE IF NOT EXISTS template_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Tabela de template de estilos
CREATE TABLE IF NOT EXISTS template_estilos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Tabela de template de momentos
CREATE TABLE IF NOT EXISTS template_momentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Adicionar constraints UNIQUE para permitir ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'template_categorias_nome_key') THEN
    ALTER TABLE template_categorias ADD CONSTRAINT template_categorias_nome_key UNIQUE (nome);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'template_estilos_nome_key') THEN
    ALTER TABLE template_estilos ADD CONSTRAINT template_estilos_nome_key UNIQUE (nome);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'template_momentos_nome_key') THEN
    ALTER TABLE template_momentos ADD CONSTRAINT template_momentos_nome_key UNIQUE (nome);
  END IF;
END $$;

-- =====================================================
-- POPULAR TEMPLATES
-- =====================================================

-- Limpa dados existentes (para re-execução segura)
-- DESABILITADO: Não fazer TRUNCATE pois pode ter dados em uso
-- TRUNCATE template_categorias, template_estilos, template_momentos;

-- CATEGORIAS (com ON CONFLICT para evitar duplicatas)
INSERT INTO template_categorias (nome) VALUES
  ('Quebrantamento/Misericórdia'),
  ('Soberania e justiça de Deus'),
  ('Fidelidade/Presença de Deus'),
  ('Presença/Providência'),
  ('Soberania e Amor de Deus'),
  ('Escatologia/Presença de Deus'),
  ('Escatologia/Santificação'),
  ('Fidelidade e misericórdia de Deus'),
  ('Escatologia/Justiça de Deus'),
  ('Escatologia/Soberania de Deus'),
  ('Quebrantamento/Presença de Deus'),
  ('Amor de Deus/Graça'),
  ('Presença/Igreja'),
  ('Glória de Deus/Quebrantamento'),
  ('Soberania de Deus/Fidelidade de Deus'),
  ('Santidade/Presença de Deus'),
  ('Justificação/Misericórdia de Deus'),
  ('Presença de Deus/Glória de Deus'),
  ('Fidelidade de Deus/Igreja'),
  ('Justificação/Paternidade de Deus'),
  ('Presença de Deus/Quebrantamento'),
  ('Justificação/Graça'),
  ('Soberania de Deus/Justiça de Deus'),
  ('Providência/Presença de Deus'),
  ('Graça/Justificação'),
  ('Amor de Deus/Graça'),
  ('Justificação/Quebrantamento'),
  ('Justificação/Amor de Deus'),
  ('Providência e Soberania de Deus'),
  ('Presença e Misericórdia de Deus'),
  ('Escatologia/Fidelidade de Deus'),
  ('Fidelidade de Deus/Justificação'),
  ('Quebrantamento/Soberania'),
  ('Justiça de Deus/Escatologia'),
  ('Presença de Deus/Escatologia'),
  ('Soberania de Deus/Misericórdia de Deus'),
  ('Misericórdia de Deus/Fidelidade de Deus'),
  ('Soberania de Deus/Presença de Deus'),
  ('Quebrantamento/Amor de Deus'),
  ('Providência de Deus/Igreja'),
  ('Graça/Amor de Deus'),
  ('Santificação/Regeneração'),
  ('Paternidade de Deus/Soberania de Deus'),
  ('Soberania de Deus/Santidade'),
  ('Amor de Deus/Fidelidade de Deus'),
  ('Providência de Deus/Fidelidade de Deus'),
  ('Misericórdia e Soberania de Deus'),
  ('Quebrantamento/Justificação'),
  ('Quebrantamento/Soberania de Deus'),
  ('Fidelidade/Presença de Deus'),
  ('Fidelidade e Soberania de Deus'),
  ('Providência/Graça'),
  ('Fidelidade e Amor de Deus'),
  ('Justiça e Soberania de Deus'),
  ('Santidade e Glória de Deus'),
  ('Presença e Soberania de Deus'),
  ('Quebrantamento/Santidade'),
  ('Soberania de Deus/Quebrantamento')
ON CONFLICT (nome) DO NOTHING;

-- ESTILOS
INSERT INTO template_estilos (nome) VALUES
  ('Contemplação'),
  ('Atemporalidade'),
  ('Celebração'),
  ('Proclamação'),
  ('Intercessão'),
  ('Gratidão'),
  ('Rendição')
ON CONFLICT (nome) DO NOTHING;

-- MOMENTOS
INSERT INTO template_momentos (nome) VALUES
  ('Abertura/Pós-Palavra'),
  ('Sequencial/Pós-Palavra'),
  ('Abertura/Sequencial'),
  ('Sequencial'),
  ('Abertura'),
  ('Medley'),
  ('Pós-Palavra'),
  ('Ceia ou Pós-Palavra')
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- FUNÇÃO: Copiar templates para nova igreja
-- =====================================================

CREATE OR REPLACE FUNCTION copiar_templates_para_igreja(p_igreja_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Copia categorias
  INSERT INTO categorias (nome, igreja_id)
  SELECT nome, p_igreja_id FROM template_categorias;

  -- Copia estilos
  INSERT INTO estilos (nome, igreja_id)
  SELECT nome, p_igreja_id FROM template_estilos;

  -- Copia momentos
  INSERT INTO momentos (nome, igreja_id)
  SELECT nome, p_igreja_id FROM template_momentos;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-popular ao criar nova igreja
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_nova_igreja()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Executa cópia dos templates para a nova igreja
  PERFORM copiar_templates_para_igreja(NEW.id);
  RETURN NEW;
END;
$$;

-- Remove trigger se existir (para re-execução segura)
DROP TRIGGER IF EXISTS on_igreja_created ON igrejas;

-- Cria trigger na tabela igrejas
CREATE TRIGGER on_igreja_created
  AFTER INSERT ON igrejas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_nova_igreja();

-- =====================================================
-- PERMISSÕES RLS
-- =====================================================

-- Habilita RLS nas tabelas de template (somente leitura)
ALTER TABLE template_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_estilos ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_momentos ENABLE ROW LEVEL SECURITY;

-- Permite leitura pública dos templates
CREATE POLICY "Templates são públicos para leitura"
  ON template_categorias FOR SELECT
  USING (true);

CREATE POLICY "Templates são públicos para leitura"
  ON template_estilos FOR SELECT
  USING (true);

CREATE POLICY "Templates são públicos para leitura"
  ON template_momentos FOR SELECT
  USING (true);
