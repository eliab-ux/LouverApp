-- =====================================================
-- DEBUG: Testar remoção de membro e ver o que está bloqueando
-- =====================================================

-- PASSO 1: Ver o contexto atual do usuário logado
SELECT
  auth.uid() as meu_user_id,
  public.get_my_igreja_id() as minha_igreja_id,
  public.get_my_papel() as meu_papel;

-- PASSO 2: Ver os dados do membro que você quer remover
-- SUBSTITUA 'cd3ee272-c19c-4959-8caa-3664edac82e2' pelo ID do membro
SELECT
  id,
  nome,
  email,
  papel,
  igreja_id
FROM public.usuarios
WHERE id = 'cd3ee272-c19c-4959-8caa-3664edac82e2';

-- PASSO 3: Testar se as condições das políticas passam
-- (simula o que o RLS está verificando)
SELECT
  'USANDO (USING)' as tipo_check,
  -- Política: admin_update_usuarios_mesma_igreja (USING)
  (public.get_my_papel() = 'admin') as "sou_admin",
  (SELECT igreja_id FROM usuarios WHERE id = 'cd3ee272-c19c-4959-8caa-3664edac82e2') as "igreja_do_membro",
  public.get_my_igreja_id() as "minha_igreja",
  ((SELECT igreja_id FROM usuarios WHERE id = 'cd3ee272-c19c-4959-8caa-3664edac82e2') = public.get_my_igreja_id()) as "mesma_igreja",
  -- Resultado final da política admin
  ((public.get_my_papel() = 'admin') AND
   ((SELECT igreja_id FROM usuarios WHERE id = 'cd3ee272-c19c-4959-8caa-3664edac82e2') = public.get_my_igreja_id())) as "admin_policy_USING_passa"

UNION ALL

SELECT
  'WITH CHECK (após update)' as tipo_check,
  (public.get_my_papel() = 'admin') as "sou_admin",
  NULL::uuid as "igreja_do_membro_DEPOIS", -- será NULL após o update
  public.get_my_igreja_id() as "minha_igreja",
  (NULL::uuid = public.get_my_igreja_id()) as "mesma_igreja",
  -- Resultado final do WITH CHECK da política admin
  ((public.get_my_papel() = 'admin') AND
   (NULL::uuid = public.get_my_igreja_id() OR NULL IS NULL)) as "admin_policy_WITH_CHECK_passa";

-- PASSO 4: Verificar se há outras políticas ativas que podem estar bloqueando
SELECT
  policyname,
  cmd,
  CASE
    WHEN cmd = 'UPDATE' THEN '⚠️ Esta política será verificada!'
    ELSE '✓ Não afeta UPDATE'
  END as status,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'usuarios'
ORDER BY cmd, policyname;

-- PASSO 5: Testar UPDATE diretamente (como seria feito pelo Supabase)
-- ATENÇÃO: Isto vai tentar fazer o UPDATE de verdade!
-- Comente esta linha se não quiser executar ainda
-- UPDATE public.usuarios
-- SET igreja_id = NULL
-- WHERE id = 'cd3ee272-c19c-4959-8caa-3664edac82e2';
