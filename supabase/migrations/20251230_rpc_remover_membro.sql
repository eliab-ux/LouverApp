-- =====================================================
-- Solução Alternativa: RPC Function para remover membro
-- Data: 2025-12-30
-- =====================================================

-- CONTEXTO:
-- As políticas RLS estão bloqueando mesmo após múltiplas tentativas.
-- Esta função RPC (Remote Procedure Call) contorna o RLS usando
-- SECURITY DEFINER, que executa com privilégios do owner da função.

-- =====================================================
-- Criar função para remover membro (admin only)
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_remover_membro(
  p_membro_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- Executa com privilégios do owner
SET search_path = public
AS $$
DECLARE
  v_meu_papel text;
  v_minha_igreja_id uuid;
  v_membro_igreja_id uuid;
  v_result jsonb;
BEGIN
  -- Verificar se quem está chamando é admin
  v_meu_papel := (SELECT papel FROM public.usuarios WHERE id = auth.uid());
  v_minha_igreja_id := (SELECT igreja_id FROM public.usuarios WHERE id = auth.uid());

  IF v_meu_papel IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  IF v_meu_papel != 'admin' THEN
    RAISE EXCEPTION 'Apenas admins podem remover membros';
  END IF;

  -- Verificar se o membro existe e pertence à mesma igreja
  SELECT igreja_id INTO v_membro_igreja_id
  FROM public.usuarios
  WHERE id = p_membro_id;

  IF v_membro_igreja_id IS NULL THEN
    RAISE EXCEPTION 'Membro não encontrado';
  END IF;

  IF v_membro_igreja_id != v_minha_igreja_id THEN
    RAISE EXCEPTION 'Membro não pertence à sua igreja';
  END IF;

  -- Não permitir admin remover a si mesmo
  IF p_membro_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode remover a si mesmo';
  END IF;

  -- Remover o membro (setar igreja_id = NULL)
  UPDATE public.usuarios
  SET igreja_id = NULL
  WHERE id = p_membro_id;

  -- Retornar sucesso
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Membro removido com sucesso',
    'membro_id', p_membro_id,
    'removido_por', auth.uid(),
    'timestamp', now()
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Retornar erro
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'membro_id', p_membro_id
    );
END;
$$;

-- =====================================================
-- Grant para authenticated users
-- =====================================================
GRANT EXECUTE ON FUNCTION public.admin_remover_membro(uuid) TO authenticated;

-- =====================================================
-- Comentário da função
-- =====================================================
COMMENT ON FUNCTION public.admin_remover_membro(uuid) IS
'Remove um membro da igreja (admin only). Contorna RLS usando SECURITY DEFINER.
Validações:
- Apenas admin pode executar
- Membro deve pertencer à mesma igreja do admin
- Admin não pode remover a si mesmo';
