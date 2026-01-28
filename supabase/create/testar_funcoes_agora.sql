-- =====================================================
-- Testar se as funções agora funcionam
-- =====================================================

-- Este teste VAI retornar NULL no SQL Editor porque você não está
-- autenticado aqui, mas serve para confirmar que as funções existem

SELECT
  'Teste 1: Funções existem?' as info,
  public.get_my_igreja_id() as igreja_id_result,
  public.get_my_papel() as papel_result,
  CASE
    WHEN public.get_my_igreja_id() IS NULL AND public.get_my_papel() IS NULL
    THEN '✅ Funções existem (NULL é esperado no SQL Editor)'
    ELSE 'Funções retornaram valores'
  END as status;

-- =====================================================
-- Ver política UPDATE atual
-- =====================================================

SELECT
  'Política UPDATE atual' as info,
  policyname,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'usuarios'
  AND cmd = 'UPDATE';
