-- Adiciona coluna telefone na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Verifica a estrutura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;
