-- Adiciona coluna de funcoes de equipe na tabela usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS funcoes text[];

-- Opcional: índice para buscar por função
CREATE INDEX IF NOT EXISTS idx_usuarios_funcoes ON usuarios USING GIN(funcoes);

-- Verificar estrutura
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;
