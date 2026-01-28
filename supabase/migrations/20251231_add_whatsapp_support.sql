-- ==========================================
-- FASE 2: ADICIONAR SUPORTE A NOTIFICAÇÕES VIA WHATSAPP
-- ==========================================

-- 1. Adicionar coluna de canal preferido de notificação na tabela usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS canal_notificacao TEXT DEFAULT 'email'
CHECK (canal_notificacao IN ('email', 'whatsapp', 'ambos'));

-- 2. Adicionar colunas de configuração do WhatsApp na tabela igrejas
ALTER TABLE igrejas
ADD COLUMN IF NOT EXISTS whatsapp_habilitado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_instance_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT;

-- 3. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_usuarios_canal_notificacao
ON usuarios(canal_notificacao);

CREATE INDEX IF NOT EXISTS idx_igrejas_whatsapp_habilitado
ON igrejas(whatsapp_habilitado)
WHERE whatsapp_habilitado = true;

-- 4. Comentários para documentação
COMMENT ON COLUMN usuarios.canal_notificacao IS
'Canal preferido para receber notificações: email, whatsapp ou ambos';

COMMENT ON COLUMN igrejas.whatsapp_habilitado IS
'Indica se a igreja tem WhatsApp habilitado para notificações';

COMMENT ON COLUMN igrejas.whatsapp_instance_id IS
'ID da instância do Evolution API para esta igreja';

COMMENT ON COLUMN igrejas.whatsapp_api_key IS
'API Key da instância do Evolution API (criptografada)';
