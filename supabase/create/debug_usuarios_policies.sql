-- =====================================================
-- DEBUG: Ver todas as políticas ativas na tabela usuarios
-- =====================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;
