-- ==========================================
-- SUPORTE A MEDLEY NO REPERTÓRIO DA ESCALA
-- ==========================================

-- 1. Adicionar coluna 'tipo' (song ou medley)
ALTER TABLE escala_musicas
ADD COLUMN tipo TEXT NOT NULL DEFAULT 'song'
CHECK (tipo IN ('song', 'medley'));

-- 2. Renomear coluna musica_id para musica_ids (array)
ALTER TABLE escala_musicas
RENAME COLUMN musica_id TO musica_ids_temp;

-- 3. Criar nova coluna musica_ids como array
ALTER TABLE escala_musicas
ADD COLUMN musica_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- 4. Migrar dados existentes (musica_id → musica_ids[0])
UPDATE escala_musicas
SET musica_ids = ARRAY[musica_ids_temp]::TEXT[]
WHERE musica_ids_temp IS NOT NULL;

-- 5. Remover coluna temporária
ALTER TABLE escala_musicas
DROP COLUMN musica_ids_temp;

-- 6. Atualizar constraint para garantir que musica_ids não seja vazio
ALTER TABLE escala_musicas
ADD CONSTRAINT musica_ids_not_empty
CHECK (array_length(musica_ids, 1) > 0);

-- 7. Comentários
COMMENT ON COLUMN escala_musicas.tipo IS 'Tipo do item: song (música única) ou medley (múltiplas músicas)';
COMMENT ON COLUMN escala_musicas.musica_ids IS 'Array de IDs de músicas. Para tipo=song, array com 1 elemento. Para tipo=medley, array ordenado com múltiplos elementos.';

-- 8. Atualizar RLS policies (se necessário, manter as mesmas)
-- As policies existentes devem continuar funcionando normalmente
