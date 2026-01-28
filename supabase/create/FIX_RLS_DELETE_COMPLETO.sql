-- ========================================
-- CORREÇÃO COMPLETA DE RLS PARA DELETE
-- Execute TODO este script de uma vez no Supabase SQL Editor
-- ========================================

-- ==========================================
-- 1. LIMPEZA - Remover políticas antigas
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
-- 2. CRIAÇÃO - Novas políticas corretas (IDEMPOTENTE)
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
-- 3. VERIFICAÇÃO - Confirmar políticas criadas
-- ==========================================

SELECT 
  tablename, 
  policyname, 
  cmd
FROM pg_policies
WHERE tablename IN ('musicas', 'categorias', 'momentos_culto', 'estilos')
AND cmd = 'DELETE'
ORDER BY tablename;
