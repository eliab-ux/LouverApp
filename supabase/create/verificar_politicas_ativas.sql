-- =====================================================
-- Verificar quais políticas UPDATE estão ativas AGORA
-- =====================================================

SELECT
  policyname,
  cmd,
  permissive,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'usuarios'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- =====================================================
-- Testar se as funções helper estão funcionando
-- Execute LOGADO como o admin (eliab@techbs.com.br)
-- =====================================================

SELECT
  'Contexto do usuário logado' as info,
  auth.uid() as meu_user_id,
  public.get_my_igreja_id() as minha_igreja_id,
  public.get_my_papel() as meu_papel;

-- =====================================================
-- Simular a verificação RLS para o UPDATE específico
-- =====================================================

SELECT
  'Verificação da política' as info,

  -- USING clause (linha ANTES do update)
  (public.get_my_papel() = 'admin') as "sou_admin",
  (SELECT igreja_id FROM usuarios WHERE id = '487928b3-1ac6-4d13-bfd9-6c0745530bcc') as "igreja_do_membro_ANTES",
  public.get_my_igreja_id() as "minha_igreja_id",

  -- Verificar USING
  (
    (public.get_my_papel() = 'admin' AND
     (SELECT igreja_id FROM usuarios WHERE id = '487928b3-1ac6-4d13-bfd9-6c0745530bcc') = public.get_my_igreja_id())
    OR
    ('487928b3-1ac6-4d13-bfd9-6c0745530bcc'::uuid = auth.uid())
  ) as "USING_passa",

  -- WITH CHECK (linha DEPOIS do update - igreja_id será NULL)
  (
    (public.get_my_papel() = 'admin' AND NULL::uuid = public.get_my_igreja_id())
    OR
    (public.get_my_papel() = 'admin' AND NULL IS NULL)
    OR
    ('487928b3-1ac6-4d13-bfd9-6c0745530bcc'::uuid = auth.uid() AND NULL::uuid = public.get_my_igreja_id())
  ) as "WITH_CHECK_passa";
