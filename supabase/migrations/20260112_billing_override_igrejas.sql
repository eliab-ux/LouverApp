-- =====================================================
-- Allow pro access without payment (manual override)
-- =====================================================

ALTER TABLE public.igrejas
  ADD COLUMN IF NOT EXISTS pro_gratuito boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.entitlement_recalculate(p_igreja_id uuid)
RETURNS public.igreja_entitlement
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config public.app_config%ROWTYPE;
  v_status text;
  v_override boolean;
  v_has_active boolean;
  v_plano text;
  v_limite_usuarios int;
  v_limite_musicas int;
  v_is_blocked boolean;
  v_ent public.igreja_entitlement;
BEGIN
  SELECT * INTO v_config FROM public.app_config WHERE id = 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'app_config not found';
  END IF;

  SELECT status, pro_gratuito INTO v_status, v_override
  FROM public.igrejas
  WHERE id = p_igreja_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'igreja not found';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.igreja_assinatura
    WHERE igreja_id = p_igreja_id
      AND status IN ('active', 'trialing')
      AND current_period_end IS NOT NULL
      AND current_period_end > now()
  ) INTO v_has_active;

  v_is_blocked := (v_status <> 'active');
  IF v_is_blocked THEN
    v_plano := 'free';
  ELSIF v_override OR v_has_active THEN
    v_plano := 'pro';
  ELSE
    v_plano := 'free';
  END IF;

  IF v_plano = 'pro' THEN
    v_limite_usuarios := v_config.pro_limite_usuarios_ativos;
    v_limite_musicas := v_config.pro_limite_musicas;
  ELSE
    v_limite_usuarios := v_config.free_limite_usuarios_ativos;
    v_limite_musicas := v_config.free_limite_musicas;
  END IF;

  INSERT INTO public.igreja_entitlement (
    igreja_id,
    plano,
    limite_usuarios_ativos,
    limite_musicas,
    is_blocked,
    updated_at
  )
  VALUES (
    p_igreja_id,
    v_plano,
    v_limite_usuarios,
    v_limite_musicas,
    v_is_blocked,
    now()
  )
  ON CONFLICT (igreja_id) DO UPDATE
  SET plano = EXCLUDED.plano,
      limite_usuarios_ativos = EXCLUDED.limite_usuarios_ativos,
      limite_musicas = EXCLUDED.limite_musicas,
      is_blocked = EXCLUDED.is_blocked,
      updated_at = now();

  SELECT * INTO v_ent FROM public.igreja_entitlement WHERE igreja_id = p_igreja_id;
  RETURN v_ent;
END;
$$;

GRANT EXECUTE ON FUNCTION public.entitlement_recalculate(uuid) TO authenticated;
