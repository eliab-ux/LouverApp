-- =====================================================
-- DEBUG: Adicionar logging completo para descobrir o erro
-- Data: 2025-12-30
-- =====================================================

-- PASSO 1: Criar tabela de logs
CREATE TABLE IF NOT EXISTS public.rls_debug_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  usuario_id uuid,
  acao text,
  detalhes jsonb,
  created_at timestamptz DEFAULT now()
);

-- Desabilitar RLS na tabela de logs (para poder gravar sempre)
ALTER TABLE public.rls_debug_log DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Criar função auxiliar para logging
CREATE OR REPLACE FUNCTION public.log_rls_check(
  p_acao text,
  p_detalhes jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.rls_debug_log (usuario_id, acao, detalhes)
  VALUES (auth.uid(), p_acao, p_detalhes);
END;
$$;

-- PASSO 3: Criar função que verifica e loga as condições RLS
CREATE OR REPLACE FUNCTION public.check_usuario_update_rls(
  p_target_user_id uuid,
  p_new_igreja_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_my_id uuid;
  v_my_igreja_id uuid;
  v_my_papel text;
  v_target_igreja_id uuid;
BEGIN
  -- Pegar contexto atual
  v_my_id := auth.uid();
  v_my_igreja_id := public.get_my_igreja_id();
  v_my_papel := public.get_my_papel();

  -- Pegar igreja_id do usuário alvo
  SELECT igreja_id INTO v_target_igreja_id
  FROM public.usuarios
  WHERE id = p_target_user_id;

  -- Montar resultado
  v_result := jsonb_build_object(
    'meu_id', v_my_id,
    'minha_igreja_id', v_my_igreja_id,
    'meu_papel', v_my_papel,
    'target_user_id', p_target_user_id,
    'target_igreja_id_ANTES', v_target_igreja_id,
    'target_igreja_id_DEPOIS', p_new_igreja_id,
    'checks', jsonb_build_object(
      'sou_admin', (v_my_papel = 'admin'),
      'target_mesma_igreja_ANTES', (v_target_igreja_id = v_my_igreja_id),
      'target_mesma_igreja_DEPOIS', (p_new_igreja_id = v_my_igreja_id),
      'target_sera_removido', (p_new_igreja_id IS NULL),
      'USING_passa', (
        (v_my_papel = 'admin' AND v_target_igreja_id = v_my_igreja_id)
        OR (p_target_user_id = v_my_id)
      ),
      'WITH_CHECK_passa', (
        (v_my_papel = 'admin' AND p_new_igreja_id = v_my_igreja_id)
        OR (v_my_papel = 'admin' AND p_new_igreja_id IS NULL)
        OR (p_target_user_id = v_my_id AND p_new_igreja_id = v_my_igreja_id)
      )
    )
  );

  -- Logar resultado
  PERFORM public.log_rls_check('check_usuario_update', v_result);

  RETURN v_result;
END;
$$;

-- PASSO 4: Criar trigger para logar tentativas de UPDATE
CREATE OR REPLACE FUNCTION public.log_usuario_update_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.log_rls_check(
    'UPDATE_ATTEMPT',
    jsonb_build_object(
      'target_user_id', OLD.id,
      'old_igreja_id', OLD.igreja_id,
      'new_igreja_id', NEW.igreja_id,
      'my_id', auth.uid(),
      'my_papel', public.get_my_papel(),
      'my_igreja_id', public.get_my_igreja_id()
    )
  );
  RETURN NEW;
END;
$$;

-- Criar trigger BEFORE UPDATE
DROP TRIGGER IF EXISTS log_usuario_update_trigger ON public.usuarios;
CREATE TRIGGER log_usuario_update_trigger
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.log_usuario_update_attempt();

-- PASSO 5: Limpar logs antigos (execute quando quiser limpar)
-- TRUNCATE public.rls_debug_log;

-- =====================================================
-- COMO USAR:
-- =====================================================

-- 1. Tente fazer o UPDATE que está falhando no frontend
-- 2. Depois execute esta query para ver os logs:

SELECT
  timestamp,
  acao,
  detalhes->>'my_id' as meu_id,
  detalhes->>'my_papel' as meu_papel,
  detalhes->>'my_igreja_id' as minha_igreja,
  detalhes->>'target_user_id' as target_user,
  detalhes->>'old_igreja_id' as igreja_antes,
  detalhes->>'new_igreja_id' as igreja_depois,
  detalhes
FROM public.rls_debug_log
ORDER BY timestamp DESC
LIMIT 10;

-- 3. Ou teste manualmente:
-- SELECT public.check_usuario_update_rls(
--   'cd3ee272-c19c-4959-8caa-3664edac82e2'::uuid,  -- ID do usuário a remover
--   NULL::uuid  -- nova igreja_id (NULL = remover)
-- );
