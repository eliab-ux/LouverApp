-- =====================================================
-- Monetization: subscription + limits + super admin
-- =====================================================

-- 1) Helper: check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE id = auth.uid()
      AND papel = 'super_admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 2) Config table (single row)
CREATE TABLE IF NOT EXISTS public.app_config (
  id int PRIMARY KEY CHECK (id = 1),
  free_limite_usuarios_ativos int NOT NULL,
  free_limite_musicas int NOT NULL,
  pro_limite_usuarios_ativos int NULL,
  pro_limite_musicas int NULL,
  sku_android_mensal text NOT NULL,
  sku_android_anual text NULL,
  sku_ios_mensal text NOT NULL,
  sku_ios_anual text NULL,
  habilitar_anual boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_config (
  id,
  free_limite_usuarios_ativos,
  free_limite_musicas,
  pro_limite_usuarios_ativos,
  pro_limite_musicas,
  sku_android_mensal,
  sku_android_anual,
  sku_ios_mensal,
  sku_ios_anual,
  habilitar_anual
)
VALUES (
  1,
  10,
  100,
  NULL,
  NULL,
  'CHANGE_ME_ANDROID_MENSAL',
  NULL,
  'CHANGE_ME_IOS_MENSAL',
  NULL,
  false
)
ON CONFLICT (id) DO NOTHING;

-- 3) Subscription table
CREATE TABLE IF NOT EXISTS public.igreja_assinatura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id uuid NOT NULL REFERENCES public.igrejas(id) ON DELETE CASCADE,
  plataforma text NOT NULL CHECK (plataforma IN ('ios', 'android')),
  sku text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired', 'suspended')),
  current_period_start timestamptz NULL,
  current_period_end timestamptz NULL,
  auto_renew boolean NULL,
  original_transaction_id text NULL,
  purchase_token text NULL,
  last_event_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_igreja_assinatura_igreja_id
  ON public.igreja_assinatura(igreja_id);
CREATE INDEX IF NOT EXISTS idx_igreja_assinatura_status
  ON public.igreja_assinatura(status);

-- 4) Entitlement cache
CREATE TABLE IF NOT EXISTS public.igreja_entitlement (
  igreja_id uuid PRIMARY KEY REFERENCES public.igrejas(id) ON DELETE CASCADE,
  plano text NOT NULL CHECK (plano IN ('free', 'pro')),
  limite_usuarios_ativos int NULL,
  limite_musicas int NULL,
  is_blocked boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Super admin audit
CREATE TABLE IF NOT EXISTS public.audit_super_admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_user_id uuid NOT NULL,
  action text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6) igrejas status columns
ALTER TABLE public.igrejas
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'canceled')),
  ADD COLUMN IF NOT EXISTS dispensada_motivo text NULL,
  ADD COLUMN IF NOT EXISTS dispensada_em timestamptz NULL;

-- 7) updated_at triggers
DROP TRIGGER IF EXISTS update_app_config_updated_at ON public.app_config;
CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_igreja_assinatura_updated_at ON public.igreja_assinatura;
CREATE TRIGGER update_igreja_assinatura_updated_at
  BEFORE UPDATE ON public.igreja_assinatura
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_igreja_entitlement_updated_at ON public.igreja_entitlement;
CREATE TRIGGER update_igreja_entitlement_updated_at
  BEFORE UPDATE ON public.igreja_entitlement
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8) RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.igreja_assinatura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.igreja_entitlement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_super_admin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_config_select ON public.app_config;
DROP POLICY IF EXISTS app_config_modify ON public.app_config;
CREATE POLICY app_config_select ON public.app_config
  FOR SELECT TO authenticated
  USING (public.is_super_admin());
CREATE POLICY app_config_modify ON public.app_config
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS igreja_assinatura_select ON public.igreja_assinatura;
DROP POLICY IF EXISTS igreja_assinatura_modify ON public.igreja_assinatura;
CREATE POLICY igreja_assinatura_select ON public.igreja_assinatura
  FOR SELECT TO authenticated
  USING (public.is_super_admin());
CREATE POLICY igreja_assinatura_modify ON public.igreja_assinatura
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS igreja_entitlement_select ON public.igreja_entitlement;
DROP POLICY IF EXISTS igreja_entitlement_modify ON public.igreja_entitlement;
CREATE POLICY igreja_entitlement_select ON public.igreja_entitlement
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR igreja_id = public.get_my_igreja_id()
  );
CREATE POLICY igreja_entitlement_modify ON public.igreja_entitlement
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS audit_super_admin_select ON public.audit_super_admin;
DROP POLICY IF EXISTS audit_super_admin_modify ON public.audit_super_admin;
CREATE POLICY audit_super_admin_select ON public.audit_super_admin
  FOR SELECT TO authenticated
  USING (public.is_super_admin());
CREATE POLICY audit_super_admin_modify ON public.audit_super_admin
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 9) Optionally allow super_admin on igrejas when RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'igrejas'
      AND c.relrowsecurity
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS igrejas_super_admin_select ON public.igrejas';
    EXECUTE 'DROP POLICY IF EXISTS igrejas_super_admin_update ON public.igrejas';
    EXECUTE 'CREATE POLICY igrejas_super_admin_select ON public.igrejas FOR SELECT TO authenticated USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY igrejas_super_admin_update ON public.igrejas FOR UPDATE TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin())';
  END IF;
END $$;

-- 10) Entitlement recompute RPC
CREATE OR REPLACE FUNCTION public.entitlement_recalculate(p_igreja_id uuid)
RETURNS public.igreja_entitlement
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config public.app_config%ROWTYPE;
  v_status text;
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

  SELECT status INTO v_status FROM public.igrejas WHERE id = p_igreja_id;
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
  ELSIF v_has_active THEN
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

-- 11) Limit enforcement - usuarios
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

  IF TG_OP = 'UPDATE' AND OLD.igreja_id IS NOT DISTINCT FROM NEW.igreja_id THEN
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
    SELECT COUNT(*) INTO v_count FROM public.usuarios WHERE igreja_id = NEW.igreja_id;
    IF v_count >= v_ent.limite_usuarios_ativos THEN
      RAISE EXCEPTION 'LIMIT_REACHED_USUARIOS' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_usuario_limit ON public.usuarios;
CREATE TRIGGER enforce_usuario_limit
  BEFORE INSERT OR UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_usuario_limit();

-- 12) Limit enforcement - musicas
CREATE OR REPLACE FUNCTION public.enforce_musica_limit()
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

  IF v_ent.plano = 'free' AND v_ent.limite_musicas IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM public.musicas WHERE igreja_id = NEW.igreja_id;
    IF v_count >= v_ent.limite_musicas THEN
      RAISE EXCEPTION 'LIMIT_REACHED_MUSICAS' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_musica_limit ON public.musicas;
CREATE TRIGGER enforce_musica_limit
  BEFORE INSERT ON public.musicas
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_musica_limit();
