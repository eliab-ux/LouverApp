-- =====================================================
-- Block escala writes on Free when limits exceeded
-- =====================================================

CREATE OR REPLACE FUNCTION public.enforce_igreja_active_by_igreja_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_ent public.igreja_entitlement;
  v_count_usuarios int;
  v_count_musicas int;
BEGIN
  IF NEW.igreja_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT status INTO v_status FROM public.igrejas WHERE id = NEW.igreja_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'IGREJA_INVALIDA' USING ERRCODE = 'P0001';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'IGREJA_SUSPENSA' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_ent FROM public.igreja_entitlement WHERE igreja_id = NEW.igreja_id;
  IF NOT FOUND THEN
    v_ent := public.entitlement_recalculate(NEW.igreja_id);
  END IF;

  IF v_ent.plano = 'free' THEN
    IF v_ent.limite_usuarios_ativos IS NOT NULL THEN
      SELECT COUNT(*) INTO v_count_usuarios FROM public.usuarios WHERE igreja_id = NEW.igreja_id;
      IF v_count_usuarios >= v_ent.limite_usuarios_ativos THEN
        RAISE EXCEPTION 'LIMIT_REACHED_USUARIOS' USING ERRCODE = 'P0001';
      END IF;
    END IF;

    IF v_ent.limite_musicas IS NOT NULL THEN
      SELECT COUNT(*) INTO v_count_musicas FROM public.musicas WHERE igreja_id = NEW.igreja_id;
      IF v_count_musicas >= v_ent.limite_musicas THEN
        RAISE EXCEPTION 'LIMIT_REACHED_MUSICAS' USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_igreja_active_by_escala_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_igreja_id uuid;
  v_ent public.igreja_entitlement;
  v_count_usuarios int;
  v_count_musicas int;
BEGIN
  IF NEW.escala_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT i.status, i.id
    INTO v_status, v_igreja_id
    FROM public.escalas e
    JOIN public.igrejas i ON i.id = e.igreja_id
   WHERE e.id = NEW.escala_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'IGREJA_INVALIDA' USING ERRCODE = 'P0001';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'IGREJA_SUSPENSA' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_ent FROM public.igreja_entitlement WHERE igreja_id = v_igreja_id;
  IF NOT FOUND THEN
    v_ent := public.entitlement_recalculate(v_igreja_id);
  END IF;

  IF v_ent.plano = 'free' THEN
    IF v_ent.limite_usuarios_ativos IS NOT NULL THEN
      SELECT COUNT(*) INTO v_count_usuarios FROM public.usuarios WHERE igreja_id = v_igreja_id;
      IF v_count_usuarios >= v_ent.limite_usuarios_ativos THEN
        RAISE EXCEPTION 'LIMIT_REACHED_USUARIOS' USING ERRCODE = 'P0001';
      END IF;
    END IF;

    IF v_ent.limite_musicas IS NOT NULL THEN
      SELECT COUNT(*) INTO v_count_musicas FROM public.musicas WHERE igreja_id = v_igreja_id;
      IF v_count_musicas >= v_ent.limite_musicas THEN
        RAISE EXCEPTION 'LIMIT_REACHED_MUSICAS' USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
