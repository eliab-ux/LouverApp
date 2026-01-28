-- =====================================================
-- TESTE: Tentar UPDATE diretamente via SQL
-- =====================================================

-- IMPORTANTE: Execute este script logado como o ADMIN que está tentando remover o membro

-- PASSO 1: Ver quem você é
SELECT
  'MEU CONTEXTO' as info,
  auth.uid() as meu_id,
  public.get_my_igreja_id() as minha_igreja_id,
  public.get_my_papel() as meu_papel;

-- PASSO 2: Ver o usuário que você quer remover
SELECT
  'USUÁRIO ALVO' as info,
  id,
  nome,
  email,
  papel,
  igreja_id
FROM public.usuarios
WHERE id = 'cd3ee272-c19c-4959-8caa-3664edac82e2';

-- PASSO 3: Ver todas as políticas UPDATE ativas
SELECT
  'POLÍTICAS ATIVAS' as info,
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'usuarios'
  AND cmd = 'UPDATE';

-- PASSO 4: Testar a função de debug
SELECT
  'TESTE DE CONDIÇÕES' as info,
  public.check_usuario_update_rls(
    'cd3ee272-c19c-4959-8caa-3664edac82e2'::uuid,
    NULL::uuid
  ) as resultado;

-- PASSO 5: Tentar o UPDATE de verdade
-- ATENÇÃO: Isto vai tentar fazer o UPDATE!
-- Se der erro, você verá a mensagem exata do PostgreSQL

BEGIN;

UPDATE public.usuarios
SET igreja_id = NULL
WHERE id = 'cd3ee272-c19c-4959-8caa-3664edac82e2';

-- Se funcionou, você verá "UPDATE 1"
-- Se deu erro, você verá a mensagem de erro do RLS

-- ROLLBACK; -- Descomente para desfazer
COMMIT; -- Comente se quiser testar sem salvar

-- PASSO 6: Ver os logs gerados
SELECT
  timestamp,
  acao,
  jsonb_pretty(detalhes) as detalhes_formatado
FROM public.rls_debug_log
ORDER BY timestamp DESC
LIMIT 5;
