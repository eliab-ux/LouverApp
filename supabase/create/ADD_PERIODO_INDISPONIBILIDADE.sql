-- ========================================
-- ADICIONAR PERÍODO DE INDISPONIBILIDADE
-- Permite usuário marcar um período (data_fim opcional)
-- ========================================

-- Adicionar coluna data_fim (opcional)
ALTER TABLE indisponibilidades 
ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Adicionar constraint: data_fim deve ser >= data
ALTER TABLE indisponibilidades
DROP CONSTRAINT IF EXISTS check_data_fim_maior_igual_data;

ALTER TABLE indisponibilidades
ADD CONSTRAINT check_data_fim_maior_igual_data 
CHECK (data_fim IS NULL OR data_fim >= data);

-- Criar índice para buscar por período
CREATE INDEX IF NOT EXISTS idx_indisponibilidades_periodo 
ON indisponibilidades(usuario_id, data, data_fim);

-- Atualizar constraint de unicidade para permitir períodos
-- Remove constraint antiga (data única)
ALTER TABLE indisponibilidades
DROP CONSTRAINT IF EXISTS indisponibilidades_usuario_id_data_key;

-- Nova constraint: não pode ter períodos sobrepostos para o mesmo usuário
-- Isso será validado no backend, pois é complexo no PostgreSQL

-- Verificar estrutura atualizada
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'indisponibilidades'
ORDER BY ordinal_position;

-- ==========================================
-- RESULTADO ESPERADO:
-- ==========================================
-- Coluna data_fim adicionada como DATE nullable
-- Constraint check_data_fim_maior_igual_data criada
-- Índice idx_indisponibilidades_periodo criado
