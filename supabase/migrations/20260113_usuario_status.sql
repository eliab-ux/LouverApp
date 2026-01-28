-- =====================================================
-- Usuario status: aguardando_verificacao | ativo | inativo
-- =====================================================

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'aguardando_verificacao'
    CHECK (status IN ('aguardando_verificacao', 'ativo', 'inativo'));

UPDATE public.usuarios u
SET status = CASE
  WHEN au.last_sign_in_at IS NOT NULL THEN 'ativo'
  WHEN au.confirmed_at IS NOT NULL OR au.email_confirmed_at IS NOT NULL OR au.invited_at IS NOT NULL THEN 'aguardando_verificacao'
  ELSE 'aguardando_verificacao'
END
FROM auth.users au
WHERE au.id = u.id;

-- Marca usuario como ativo no primeiro login (apenas se aguardando verificacao)
CREATE OR REPLACE FUNCTION public.mark_usuario_ativo()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.usuarios
  SET status = 'ativo'
  WHERE id = auth.uid()
    AND status = 'aguardando_verificacao';
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_usuario_ativo() TO authenticated;

-- Atualiza regra de limite de usuarios (considera apenas ativos)
CREATE OR REPLACE FUNCTION public.enforce_usuario_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ent public.igreja_entitlement;
  v_count int;
BEGIN
  IF NEW.igreja_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_ent FROM public.igreja_entitlement WHERE igreja_id = NEW.igreja_id;
  IF NOT FOUND THEN
    v_ent := public.entitlement_recalculate(NEW.igreja_id);
  END IF;

  IF v_ent.is_blocked THEN
    RAISE EXCEPTION 'IGREJA_SUSPENSA' USING ERRCODE = 'P0001';
  END IF;

  IF v_ent.plano = 'free' AND v_ent.limite_usuarios_ativos IS NOT NULL THEN
    IF NEW.status = 'ativo' AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status)) THEN
      SELECT COUNT(*) INTO v_count
      FROM public.usuarios
      WHERE igreja_id = NEW.igreja_id
        AND status = 'ativo';

      IF v_count >= v_ent.limite_usuarios_ativos THEN
        RAISE EXCEPTION 'LIMIT_REACHED_USUARIOS' USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Remover membro = marcar como inativo e remover da igreja
CREATE OR REPLACE FUNCTION public.admin_remover_membro(
  p_membro_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meu_papel text;
  v_minha_igreja_id uuid;
  v_membro_igreja_id uuid;
  v_result jsonb;
BEGIN
  v_meu_papel := (SELECT papel FROM public.usuarios WHERE id = auth.uid());
  v_minha_igreja_id := (SELECT igreja_id FROM public.usuarios WHERE id = auth.uid());

  IF v_meu_papel IS NULL THEN
    RAISE EXCEPTION 'Usuario nao encontrado';
  END IF;

  IF v_meu_papel != 'admin' THEN
    RAISE EXCEPTION 'Apenas admins podem remover membros';
  END IF;

  SELECT igreja_id INTO v_membro_igreja_id
  FROM public.usuarios
  WHERE id = p_membro_id;

  IF v_membro_igreja_id IS NULL THEN
    RAISE EXCEPTION 'Membro nao encontrado';
  END IF;

  IF v_membro_igreja_id != v_minha_igreja_id THEN
    RAISE EXCEPTION 'Membro nao pertence a sua igreja';
  END IF;

  IF p_membro_id = auth.uid() THEN
    RAISE EXCEPTION 'Voce nao pode remover a si mesmo';
  END IF;

  UPDATE public.usuarios
  SET igreja_id = NULL,
      status = 'inativo'
  WHERE id = p_membro_id;

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
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'membro_id', p_membro_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_remover_membro(uuid) TO authenticated;
