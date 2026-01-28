-- =====================================================
-- Verificar se as funções helper existem e funcionam
-- =====================================================

-- 1. Verificar se as funções existem
SELECT
  'Funções disponíveis' as info,
  proname as nome_funcao,
  pg_get_functiondef(oid) as definicao
FROM pg_proc
WHERE proname IN ('get_my_papel', 'get_my_igreja_id')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Se retornar vazio, as funções NÃO EXISTEM!
-- Neste caso, as políticas RLS estão usando funções inexistentes.

-- 3. Testar auth.uid() (vai retornar NULL no SQL Editor, mas mostra se a função existe)
SELECT
  'Teste de auth.uid()' as info,
  auth.uid() as user_id,
  CASE
    WHEN auth.uid() IS NULL THEN 'NULL (esperado no SQL Editor - você não está autenticado aqui)'
    ELSE 'Autenticado'
  END as status;
