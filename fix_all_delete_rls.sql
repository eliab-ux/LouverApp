-- ========================================
-- CORREÇÃO COMPLETA DE RLS PARA DELETE
-- Todas as tabelas: musicas, categorias, momentos_culto, estilos
-- ========================================
-- Execute este script COMPLETO no Supabase SQL Editor

-- ==========================================
-- 1. DIAGNÓSTICO - Verificar políticas atuais
-- ==========================================

-- Verificar RLS ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('musicas', 'categorias', 'momentos_culto', 'estilos');

-- Listar TODAS as políticas de DELETE existentes
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('musicas', 'categorias', 'momentos_culto', 'estilos')
AND cmd = 'DELETE'
ORDER BY tablename;

-- ==========================================
-- 2. LIMPEZA - Remover políticas antigas
-- ==========================================

-- MUSICAS
DROP POLICY IF EXISTS "Usuarios podem deletar musicas de sua igreja" ON musicas;
DROP POLICY IF EXISTS "Apenas admin pode deletar musicas" ON musicas;
DROP POLICY IF EXISTS "Admin pode deletar musicas" ON musicas;
DROP POLICY IF EXISTS "Admin pode deletar musicas da igreja" ON musicas;
DROP POLICY IF EXISTS "Users can delete their church musicas" ON musicas;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON musicas;

-- CATEGORIAS
DROP POLICY IF EXISTS "Usuarios podem deletar categorias de sua igreja" ON categorias;
DROP POLICY IF EXISTS "Apenas admin pode deletar categorias" ON categorias;
DROP POLICY IF EXISTS "Admin pode deletar categorias" ON categorias;
DROP POLICY IF EXISTS "Admin pode deletar categorias da igreja" ON categorias;
DROP POLICY IF EXISTS "Users can delete their church categorias" ON categorias;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON categorias;

-- MOMENTOS_CULTO
DROP POLICY IF EXISTS "Usuarios podem deletar momentos de sua igreja" ON momentos_culto;
DROP POLICY IF EXISTS "Apenas admin pode deletar momentos" ON momentos_culto;
DROP POLICY IF EXISTS "Admin pode deletar momentos" ON momentos_culto;
DROP POLICY IF EXISTS "Admin pode deletar momentos da igreja" ON momentos_culto;
DROP POLICY IF EXISTS "Users can delete their church momentos" ON momentos_culto;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON momentos_culto;

-- ESTILOS
DROP POLICY IF EXISTS "Usuarios podem deletar estilos de sua igreja" ON estilos;
DROP POLICY IF EXISTS "Apenas admin pode deletar estilos" ON estilos;
DROP POLICY IF EXISTS "Admin pode deletar estilos" ON estilos;
DROP POLICY IF EXISTS "Admin pode deletar estilos da igreja" ON estilos;
DROP POLICY IF EXISTS "Users can delete their church estilos" ON estilos;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON estilos;

-- ==========================================
-- 3. CRIAÇÃO - Novas políticas corretas
-- ==========================================

-- MUSICAS - Apenas ADMIN pode deletar
DROP POLICY IF EXISTS "Admin delete musicas" ON musicas;
CREATE POLICY "Admin delete musicas"
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

-- CATEGORIAS - Apenas ADMIN pode deletar
DROP POLICY IF EXISTS "Admin delete categorias" ON categorias;
CREATE POLICY "Admin delete categorias"
ON categorias
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = categorias.igreja_id
    AND usuarios.papel = 'admin'
  )
);

-- MOMENTOS_CULTO - Apenas ADMIN pode deletar
DROP POLICY IF EXISTS "Admin delete momentos_culto" ON momentos_culto;
CREATE POLICY "Admin delete momentos_culto"
ON momentos_culto
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = momentos_culto.igreja_id
    AND usuarios.papel = 'admin'
  )
);

-- ESTILOS - Apenas ADMIN pode deletar
DROP POLICY IF EXISTS "Admin delete estilos" ON estilos;
CREATE POLICY "Admin delete estilos"
ON estilos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.igreja_id = estilos.igreja_id
    AND usuarios.papel = 'admin'
  )
);

-- ==========================================
-- 4. VERIFICAÇÃO - Confirmar políticas criadas
-- ==========================================

SELECT 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN qual LIKE '%papel = ''admin''%' THEN 'Apenas Admin'
    ELSE 'Outros'
  END as restricao
FROM pg_policies
WHERE tablename IN ('musicas', 'categorias', 'momentos_culto', 'estilos')
AND cmd = 'DELETE'
ORDER BY tablename;

-- ==========================================
-- 5. TESTE - Verificar seu usuário
-- ==========================================
-- IMPORTANTE: Substitua 'SEU_EMAIL_AQUI' pelo seu email

SELECT 
  u.id,
  u.email,
  u.papel,
  u.igreja_id,
  COUNT(DISTINCT m.id) as total_musicas,
  COUNT(DISTINCT c.id) as total_categorias,
  COUNT(DISTINCT mo.id) as total_momentos,
  COUNT(DISTINCT e.id) as total_estilos
FROM usuarios u
LEFT JOIN musicas m ON m.igreja_id = u.igreja_id
LEFT JOIN categorias c ON c.igreja_id = u.igreja_id
LEFT JOIN momentos_culto mo ON mo.igreja_id = u.igreja_id
LEFT JOIN estilos e ON e.igreja_id = u.igreja_id
WHERE u.email = 'SEU_EMAIL_AQUI'  -- ← MUDE AQUI!
GROUP BY u.id, u.email, u.papel, u.igreja_id;

-- ==========================================
-- RESULTADO ESPERADO:
-- ==========================================
-- Passo 1: Todas as tabelas com rowsecurity = true
-- Passo 2: Listar políticas antigas (podem estar vazias)
-- Passo 3: Sem erros ao remover
-- Passo 4: 4 políticas criadas (uma por tabela)
-- Passo 5: Mostrar as 4 novas políticas com restrição "Apenas Admin"
-- Passo 6: Seu papel deve ser 'admin'
