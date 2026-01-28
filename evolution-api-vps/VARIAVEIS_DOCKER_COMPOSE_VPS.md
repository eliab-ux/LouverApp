# 🔧 Variáveis de Ambiente - Evolution API VPS

Este arquivo contém as variáveis de ambiente que devem estar configuradas no seu docker-compose da VPS.

## 📝 Variáveis Obrigatórias

```yaml
environment:
  # ============================================
  # SERVIDOR
  # ============================================
  SERVER_URL: https://evo2.techbs.com.br

  # ============================================
  # AUTENTICAÇÃO
  # ============================================
  AUTHENTICATION_API_KEY: fBnYucFByBobrNJvhdfBU8Y3JEqYeZfB

  # ============================================
  # DATABASE (PostgreSQL Supabase)
  # ============================================
  DATABASE_ENABLED: true
  DATABASE_PROVIDER: postgresql
  DATABASE_CONNECTION_URI: postgresql://postgres.jzdjgibnsorwhjebuhpd:hWFTUOooYJD3kw0Y@aws-0-us-east-1.pooler.supabase.com:6543/evolution_api?schema=evolution
  DATABASE_SAVE_DATA_INSTANCE: true
  DATABASE_SAVE_DATA_NEW_MESSAGE: true
  DATABASE_SAVE_MESSAGE_UPDATE: true
  DATABASE_SAVE_DATA_CONTACTS: true
  DATABASE_SAVE_DATA_CHATS: true

  # ============================================
  # WEBHOOK (Integração com Supabase)
  # ============================================
  WEBHOOK_GLOBAL_ENABLED: true
  WEBHOOK_GLOBAL_URL: https://wajbaxzpehfkapqndfwv.supabase.co/functions/v1/whatsapp_webhook?token=Af3Ws24XS6fFY7RiUctKBXcAixGVAbc0RGtvrCsv1WL8dGOZTw3jdSVPzesk5GCQ
  WEBHOOK_EVENTS: ["MESSAGES_UPSERT","MESSAGES_UPDATE","SEND_MESSAGE"]

  # ============================================
  # WHATSAPP
  # ============================================
  QRCODE_COLOR: "#198754"

  # ============================================
  # LOGS
  # ============================================
  LOG_LEVEL: INFO
  LOG_COLOR: true
  LOG_BAILEYS: error

  # ============================================
  # INSTÂNCIAS
  # ============================================
  DEL_INSTANCE: false
  DEL_TEMP_INSTANCES: true
```

---

## 🔍 Como Verificar se está Funcionando

### 1️⃣ Verificar se o Webhook está Ativo

```bash
curl -X GET "https://evo2.techbs.com.br/webhook/find/louvorapp" \
  -H "apikey: fBnYucFByBobrNJvhdfBU8Y3JEqYeZfB"
```

**Resposta esperada:**
```json
{
  "enabled": true,
  "url": "https://wajbaxzpehfkapqndfwv.supabase.co/functions/v1/whatsapp_webhook?token=...",
  "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE"]
}
```

---

### 2️⃣ Configurar Webhook Manualmente (se necessário)

Se o webhook global não estiver ativo, você pode configurar especificamente para a instância `louvorapp`:

```bash
curl -X POST "https://evo2.techbs.com.br/webhook/set/louvorapp" \
  -H "apikey: fBnYucFByBobrNJvhdfBU8Y3JEqYeZfB" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "url": "https://wajbaxzpehfkapqndfwv.supabase.co/functions/v1/whatsapp_webhook?token=Af3Ws24XS6fFY7RiUctKBXcAixGVAbc0RGtvrCsv1WL8dGOZTw3jdSVPzesk5GCQ",
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "SEND_MESSAGE"
    ]
  }'
```

---

## 📊 Fluxo de Mensagens

```
WhatsApp → Evolution API → Webhook → Supabase Edge Function → LouvorApp
```

1. **Alguém envia mensagem** para o WhatsApp conectado
2. **Evolution API** recebe a mensagem
3. **Evolution API** envia para o **Webhook** (Edge Function `whatsapp_webhook`)
4. **Edge Function** processa e salva no **Supabase**
5. **LouvorApp** exibe a mensagem (se implementado)

---

## 🔐 Credenciais Importantes

| Variável | Valor |
|----------|-------|
| **API Key Evolution** | `fBnYucFByBobrNJvhdfBU8Y3JEqYeZfB` |
| **Supabase URL** | `https://wajbaxzpehfkapqndfwv.supabase.co` |
| **Webhook Token** | `Af3Ws24XS6fFY7RiUctKBXcAixGVAbc0RGtvrCsv1WL8dGOZTw3jdSVPzesk5GCQ` |
| **DB Connection** | `postgresql://postgres.jzdjgibnsorwhjebuhpd:hWFTUOooYJD3kw0Y@aws-0-us-east-1.pooler.supabase.com:6543/evolution_api?schema=evolution` |

---

## ⚠️ Importante

- **Sempre use HTTPS** para webhooks (HTTP não funciona)
- **Token no webhook** é obrigatório para segurança
- **Schema `evolution`** no PostgreSQL para isolar dados
- **Reinicie o container** após alterar variáveis de ambiente

---

## 🧪 Testando

Após configurar, teste enviando uma mensagem para o WhatsApp conectado e verifique se o webhook está sendo chamado nos logs do Supabase:

**Dashboard Supabase → Functions → whatsapp_webhook → Logs**

https://supabase.com/dashboard/project/wajbaxzpehfkapqndfwv/functions/whatsapp_webhook/logs

---

**Data de criação:** 2026-01-10
**Projeto:** LouvorApp WhatsApp Integration
