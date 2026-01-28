-- ========================================
-- DIAGNÓSTICO E CORREÇÃO DE RLS PARA DELETE
-- ========================================
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar se RLS está ativo na tabela musicas
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'musicas';

-- PASSO 2: Listar TODAS as políticas existentes na tabela musicas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'musicas'
ORDER BY cmd;

-- PASSO 3: Remover TODAS as políticas de DELETE antigas
DROP POLICY IF EXISTS "Usuarios podem deletar musicas de sua igreja" ON musicas;
DROP POLICY IF EXISTS "Apenas admin pode deletar musicas" ON musicas;
DROP POLICY IF EXISTS "Admin pode deletar musicas" ON musicas;
DROP POLICY IF EXISTS "Users can delete their church musicas" ON musicas;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON musicas;

-- PASSO 4: Criar política de DELETE correta (APENAS ADMIN)
CREATE POLICY "Admin pode deletar musicas da igreja"
ON musicas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = musicas.igreja_id
    AND usuarios.papel = 'admin'
  )
);

-- PASSO 5: Verificar se a política foi criada corretamente
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'musicas' AND cmd = 'DELETE';

-- PASSO 6: Testar com seu usuário atual
-- Substitua 'SEU_EMAIL' pelo email do seu usuário admin
SELECT 
  u.id as usuario_id,
  u.email,
  u.papel,
  u.igreja_id,
  COUNT(m.id) as total_musicas_visiveis
FROM usuarios u
LEFT JOIN musicas m ON m.igreja_id = u.igreja_id
WHERE u.email = 'SEU_EMAIL'  -- MUDE AQUI!
GROUP BY u.id, u.email, u.papel, u.igreja_id;
