-- =====================================================
-- Block writes when igreja is suspended/canceled
-- =====================================================

-- 1) Direct tables with igreja_id
CREATE OR REPLACE FUNCTION public.enforce_igreja_active_by_igreja_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
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

  RETURN NEW;
END;
$$;

-- 2) Tables that reference escala_id -> escalas.igreja_id
CREATE OR REPLACE FUNCTION public.enforce_igreja_active_by_escala_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  IF NEW.escala_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT i.status
    INTO v_status
    FROM public.escalas e
    JOIN public.igrejas i ON i.id = e.igreja_id
   WHERE e.id = NEW.escala_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'IGREJA_INVALIDA' USING ERRCODE = 'P0001';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'IGREJA_SUSPENSA' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Triggers
DROP TRIGGER IF EXISTS enforce_eventos_igreja_active ON public.eventos;
CREATE TRIGGER enforce_eventos_igreja_active
  BEFORE INSERT OR UPDATE ON public.eventos
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_igreja_active_by_igreja_id();

DROP TRIGGER IF EXISTS enforce_escalas_igreja_active ON public.escalas;
CREATE TRIGGER enforce_escalas_igreja_active
  BEFORE INSERT OR UPDATE ON public.escalas
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_igreja_active_by_igreja_id();

DROP TRIGGER IF EXISTS enforce_indisponibilidades_igreja_active ON public.indisponibilidades;
CREATE TRIGGER enforce_indisponibilidades_igreja_active
  BEFORE INSERT OR UPDATE ON public.indisponibilidades
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_igreja_active_by_igreja_id();

DROP TRIGGER IF EXISTS enforce_escalados_igreja_active ON public.escalados;
CREATE TRIGGER enforce_escalados_igreja_active
  BEFORE INSERT OR UPDATE ON public.escalados
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_igreja_active_by_escala_id();

DROP TRIGGER IF EXISTS enforce_escala_musicas_igreja_active ON public.escala_musicas;
CREATE TRIGGER enforce_escala_musicas_igreja_active
  BEFORE INSERT OR UPDATE ON public.escala_musicas
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_igreja_active_by_escala_id();
