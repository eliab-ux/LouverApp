-- =====================================================
-- Default Evolution API settings for new churches
-- =====================================================

ALTER TABLE public.app_config
  ADD COLUMN IF NOT EXISTS default_whatsapp_instance_id text,
  ADD COLUMN IF NOT EXISTS default_whatsapp_api_key text,
  ADD COLUMN IF NOT EXISTS default_whatsapp_enabled boolean NOT NULL DEFAULT false;
