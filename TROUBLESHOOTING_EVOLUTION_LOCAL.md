# 🔧 Troubleshooting - Evolution API Local

## Problema Atual

A Evolution API local está rodando corretamente no Docker, mas **não está gerando QR Code** para conexão WhatsApp.

### Sintomas

1. ✅ API responde corretamente em `http://localhost:8080`
2. ✅ PostgreSQL conectado e funcionando
3. ✅ Instâncias são criadas com sucesso via API
4. ✅ Status da instância mostra `"connecting"`
5. ❌ **Endpoint `/instance/connect/NOME` retorna `{"count":0}` ao invés do QR Code**
6. ❌ **Loop infinito nos logs**: `[ChannelStartupService] Baileys version env: 2,3000,1015901307`

### Logs Observados

```
[Evolution API] [louvor] v2.2.3 - INFO [ChannelStartupService] Browser: Evolution API,Chrome,6.6.87.2-microsoft-standard-WSL2
[Evolution API] [louvor] v2.2.3 - INFO [ChannelStartupService] Baileys version env: 2,3000,1015901307
[Evolution API] [louvor] v2.2.3 - INFO [ChannelStartupService] Group Ignore: false
```

**Esse padrão se repete infinitamente** sem nunca estabelecer conexão ou gerar QR Code.

---

## Configuração Atual

### Docker Compose ([docker-compose.evolution.yml](./docker-compose.evolution.yml))

```yaml
services:
  evolution-api:
    image: atendai/evolution-api:latest  # v2.2.3
    container_name: evolution-api-louvorapp
    ports:
      - "8080:8080"
    environment:
      SERVER_URL: http://localhost:8080
      AUTHENTICATION_API_KEY: louvorapp_dev_secret_key_2024

      DATABASE_ENABLED: true
      DATABASE_PROVIDER: postgresql
      DATABASE_CONNECTION_URI: postgresql://postgres:postgres@evolution-postgres:5432/evolution_local
      DATABASE_SAVE_DATA_INSTANCE: true
      DATABASE_SAVE_DATA_NEW_MESSAGE: true
      DATABASE_SAVE_MESSAGE_UPDATE: true
      DATABASE_SAVE_DATA_CONTACTS: true
      DATABASE_SAVE_DATA_CHATS: true

      QRCODE_COLOR: "#198754"
      LOG_LEVEL: INFO
      LOG_COLOR: true
      LOG_BAILEYS: error

      DEL_INSTANCE: false
      DEL_TEMP_INSTANCES: true

  evolution-postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: evolution_local
```

### Tentativas Realizadas

1. ✅ Migração de SQLite para PostgreSQL
2. ✅ Adicionadas variáveis `DATABASE_SAVE_DATA_*`
3. ✅ Ajustados volumes `evolution_instances` e `evolution_store`
4. ✅ Adicionada variável `LOG_BAILEYS: error`
5. ✅ Deletadas e recriadas instâncias múltiplas vezes
6. ✅ Aguardado até 15+ segundos após criação
7. ❌ **Nenhuma tentativa resolveu o problema do loop**

### Comandos Testados

```bash
# Criar instância
curl -X POST "http://localhost:8080/instance/create" \
  -H "apikey: louvorapp_dev_secret_key_2024" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"louvor","integration":"WHATSAPP-BAILEYS","qrcode":true}'

# Resposta:
{"instance":{"status":"connecting"},"qrcode":{"count":0}}

# Buscar QR Code
curl -X GET "http://localhost:8080/instance/connect/louvor" \
  -H "apikey: louvorapp_dev_secret_key_2024"

# Resposta (PROBLEMA):
{"count":0}

# Esperado:
{"count":1, "qrcode":"data:image/png;base64,..."}
```

---

## Possíveis Causas

### 1. Incompatibilidade com WSL/Windows

- Ambiente: Windows 10/11 com WSL2
- Docker Desktop para Windows
- Possível problema: Baileys pode ter problemas com networking em WSL2

**Evidência**: Outros usuários reportam problemas similares com Evolution API em WSL.

### 2. Versão do Evolution API

- Versão atual: `v2.2.3` (latest)
- Possível problema: Bug conhecido nesta versão

**Ação**: Testar versão anterior estável (v2.1.x)

### 3. Falta de Dependências no Container

- Possível problema: Chrome/Chromium não instalado corretamente
- Baileys usa headless browser para WhatsApp Web

**Evidência**: Logs mostram `Browser: Evolution API,Chrome,6.6.87.2-microsoft-standard-WSL2` mas não há confirmação de inicialização.

### 4. Problema de Rede/Firewall

- Possível problema: Container não consegue acessar servidores WhatsApp
- Necessário para gerar QR Code

---

## Próximos Passos

### 🔴 Opção 1: Testar Versão Anterior

```bash
# Editar docker-compose.evolution.yml
# Trocar:
image: atendai/evolution-api:latest
# Por:
image: atendai/evolution-api:v2.1.1

# Reiniciar
docker-compose -f docker-compose.evolution.yml down
docker-compose -f docker-compose.evolution.yml up -d
```

### 🟡 Opção 2: Usar Evolution API na VPS

**Vantagens**:
- Ambiente Linux nativo (sem WSL)
- Já configurado para produção
- Acesso via domínio `evolution.techbs.com.br`

**Próximos passos**:
1. Deploy do pacote [evolution-api-vps/](./evolution-api-vps/) na VPS
2. Configurar firewall e DNS
3. Testar QR Code em produção
4. Integrar com LouvorApp via Edge Functions

### 🟢 Opção 3: Usar Serviço Externo

- **Evolution API Cloud**: https://evolution-api.com/pricing
- **Alternativas**: Baileys standalone, WhatsApp Business API

---

## Status da Configuração VPS

A pasta [evolution-api-vps/](./evolution-api-vps/) está **PRONTA** para deploy:

```
evolution-api-vps/
├── docker-compose.yml       ✅ Configurado para VPS
├── .env                      ✅ Credenciais Supabase PostgreSQL
├── .gitignore                ✅ Protege .env
└── INSTALACAO_RAPIDA.md      ✅ Guia de instalação
```

**Banco de dados Supabase**:
- ✅ Database `evolution_api` criado
- ✅ Schema `evolution` criado
- ✅ Credenciais configuradas no `.env`

**GitLab Repository**:
- 📦 Pronto para push em `https://gitlab.com/eliab1/evolution_api`

---

## Recomendação

### 🎯 **Seguir com deploy na VPS** (Opção 2)

**Motivo**: O ambiente local apresenta problemas conhecidos com WSL/Windows. A VPS oferece:
1. Ambiente Linux nativo
2. IP público para webhooks
3. Produção real do LouvorApp
4. Configuração já testada

### Próximo Passo Imediato

1. Fazer deploy na VPS seguindo [evolution-api-vps/INSTALACAO_RAPIDA.md](./evolution-api-vps/INSTALACAO_RAPIDA.md)
2. Testar QR Code em produção
3. Configurar Edge Functions do LouvorApp
4. Integrar WhatsApp notifications

---

## Logs Completos para Debug

Se quiser continuar debugando local:

```bash
# Ver logs completos
docker logs evolution-api-louvorapp --tail 200

# Ver apenas erros
docker logs evolution-api-louvorapp 2>&1 | grep -i error

# Acompanhar em tempo real
docker logs -f evolution-api-louvorapp

# Verificar status da instância
curl -X GET "http://localhost:8080/instance/fetchInstances?instanceName=louvor" \
  -H "apikey: louvorapp_dev_secret_key_2024"
```

---

## Links Úteis

- Documentação Evolution API: https://doc.evolution-api.com
- GitHub Evolution API: https://github.com/EvolutionAPI/evolution-api
- Issues conhecidas: https://github.com/EvolutionAPI/evolution-api/issues
- Suporte Discord: https://evolution-api.com/discord

---

**Última atualização**: 2026-01-06 13:15 (BRT)
