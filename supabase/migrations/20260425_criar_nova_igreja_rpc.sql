-- Corrigir cadastro de nova igreja: o signUp sem confirmação de email não cria
-- sessão JWT imediata, então INSERT direto em igrejas/usuarios falha.
-- Solução: RPC SECURITY DEFINER que cria igreja + admin atomicamente,
-- chamável pelo role anon sem depender de sessão ativa.

CREATE OR REPLACE FUNCTION public.criar_nova_igreja(
  p_user_id    uuid,
  p_nome_igreja text,
  p_cnpj        text DEFAULT NULL,
  p_nome_admin  text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_igreja_id              uuid;
  v_email                  text;
  v_whatsapp_enabled       boolean := false;
  v_whatsapp_instance_id   text    := null;
  v_whatsapp_api_key       text    := null;
BEGIN
  -- Verificar que o user_id existe em auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario nao encontrado');
  END IF;

  -- Buscar configurações padrão de WhatsApp (SECURITY DEFINER ignora RLS)
  SELECT
    COALESCE(default_whatsapp_enabled, false),
    default_whatsapp_instance_id,
    default_whatsapp_api_key
  INTO
    v_whatsapp_enabled,
    v_whatsapp_instance_id,
    v_whatsapp_api_key
  FROM public.app_config
  WHERE id = 1;

  -- Criar a igreja (o trigger on_igreja_created copia templates automaticamente)
  INSERT INTO public.igrejas (nome, cnpj, whatsapp_habilitado, whatsapp_instance_id, whatsapp_api_key)
  VALUES (
    trim(p_nome_igreja),
    NULLIF(trim(COALESCE(p_cnpj, '')), ''),
    COALESCE(v_whatsapp_enabled, false),
    v_whatsapp_instance_id,
    v_whatsapp_api_key
  )
  RETURNING id INTO v_igreja_id;

  -- Criar registro do usuário como admin da nova igreja
  INSERT INTO public.usuarios (id, email, nome, papel, funcoes, igreja_id, status)
  VALUES (
    p_user_id,
    v_email,
    COALESCE(NULLIF(trim(COALESCE(p_nome_admin, '')), ''), v_email),
    'admin',
    '[]'::jsonb,
    v_igreja_id,
    'ativo'
  )
  ON CONFLICT (id) DO UPDATE
    SET igreja_id = v_igreja_id,
        papel     = 'admin',
        status    = 'ativo';

  RETURN jsonb_build_object('success', true, 'igreja_id', v_igreja_id);

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_nova_igreja(uuid, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.criar_nova_igreja(uuid, text, text, text) TO authenticated;
