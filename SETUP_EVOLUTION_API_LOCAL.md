# Setup Evolution API Local (Windows)

Este guia mostra como configurar a Evolution API localmente na sua máquina Windows para desenvolvimento e testes.

## Passo 1: Instalar Docker Desktop

### Download
1. Acesse: https://www.docker.com/products/docker-desktop/
2. Clique em "Download for Windows"
3. Execute o instalador `Docker Desktop Installer.exe`

### Instalação
1. Durante a instalação, marque a opção **"Use WSL 2 instead of Hyper-V"** (recomendado)
2. Conclua a instalação
3. **Reinicie o computador** quando solicitado

### Verificação
Após reiniciar, abra o PowerShell e execute:
```powershell
docker --version
docker compose version
```

Você deve ver algo como:
```
Docker version 24.0.x, build xxxxx
Docker Compose version v2.x.x
```

---

## Passo 2: Criar Estrutura de Arquivos

Vamos criar uma pasta para a Evolution API no seu projeto:

```powershell
mkdir evolution-api-local
cd evolution-api-local
```

---

## Passo 3: Criar docker-compose.yml

Crie o arquivo `evolution-api-local/docker-compose.yml` com o seguinte conteúdo:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: evolution-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: evolution
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: evolution123
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - evolution-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: evolution-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data
    networks:
      - evolution-network

  # Evolution API
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    ports:
      - "8080:8080"
    environment:
      # Server
      SERVER_URL: http://localhost:8080

      # Database
      DATABASE_ENABLED: true
      DATABASE_PROVIDER: postgresql
      DATABASE_CONNECTION_URI: postgresql://evolution:evolution123@postgres:5432/evolution
      DATABASE_CONNECTION_CLIENT_NAME: evolution_client

      # Redis
      REDIS_ENABLED: true
      REDIS_URI: redis://redis:6379
      REDIS_PREFIX_KEY: evolution

      # Authentication
      AUTHENTICATION_TYPE: apikey
      AUTHENTICATION_API_KEY: CHANGE_THIS_TO_RANDOM_STRING
      AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: true

      # QR Code
      QRCODE_LIMIT: 30
      QRCODE_COLOR: "#198754"

      # Logs
      LOG_LEVEL: ERROR,WARN,DEBUG,INFO,LOG,VERBOSE,DARK,WEBHOOKS
      LOG_COLOR: true
      LOG_BAILEYS: false

      # Webhook
      WEBHOOK_GLOBAL_ENABLED: false

      # RabbitMQ (desabilitado para dev local)
      RABBITMQ_ENABLED: false

      # SQS (desabilitado para dev local)
      SQS_ENABLED: false

      # Websocket
      WEBSOCKET_ENABLED: false

      # Instance
      DEL_INSTANCE: false
      DEL_TEMP_INSTANCES: true

      # Storage
      STORAGE_TYPE: local
      STORAGE_LOCAL_PATH: /evolution/instances

    volumes:
      - evolution_data:/evolution/instances
    networks:
      - evolution-network

volumes:
  postgres_data:
  redis_data:
  evolution_data:

networks:
  evolution-network:
    driver: bridge
```

---

## Passo 4: Gerar API Key Segura

**IMPORTANTE:** Antes de subir, gere uma API Key aleatória segura:

### Opção 1: PowerShell
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Opção 2: Node.js
```javascript
require('crypto').randomBytes(32).toString('hex')
```

### Opção 3: Site
Acesse: https://www.uuidgenerator.net/api/guid

Copie a API Key gerada e substitua `CHANGE_THIS_TO_RANDOM_STRING` no arquivo `docker-compose.yml`.

**Exemplo:**
```yaml
AUTHENTICATION_API_KEY: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## Passo 5: Subir a Evolution API

No diretório `evolution-api-local/`, execute:

```powershell
docker compose up -d
```

Isso vai:
1. Baixar as imagens do Docker (PostgreSQL, Redis, Evolution API)
2. Criar os containers
3. Iniciar todos os serviços

### Verificar se está rodando

```powershell
docker compose ps
```

Você deve ver 3 containers rodando:
- evolution-postgres
- evolution-redis
- evolution-api

### Ver logs (se necessário)

```powershell
# Ver logs da Evolution API
docker compose logs -f evolution-api

# Ver logs de todos os serviços
docker compose logs -f
```

---

## Passo 6: Acessar a Evolution API

A API estará disponível em: **http://localhost:8080**

### Testar a API

Abra o navegador ou use PowerShell:

```powershell
Invoke-WebRequest -Uri "http://localhost:8080" -Method GET
```

Você deve ver uma resposta da API.

---

## Passo 7: Criar uma Instância de WhatsApp

### Método 1: Via Swagger UI (Recomendado para Dev)

1. Acesse: http://localhost:8080/docs
2. Você verá a documentação Swagger da API
3. Procure por **POST /instance/create**
4. Clique em "Try it out"
5. Preencha o body:

```json
{
  "instanceName": "louvorapp-dev",
  "token": "SUA_API_KEY_AQUI",
  "qrcode": true
}
```

6. Clique em "Execute"

### Método 2: Via PowerShell (curl)

```powershell
$headers = @{
    "apikey" = "SUA_API_KEY_AQUI"
    "Content-Type" = "application/json"
}

$body = @{
    instanceName = "louvorapp-dev"
    qrcode = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/instance/create" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

### Resposta Esperada

```json
{
  "instance": {
    "instanceName": "louvorapp-dev",
    "status": "created"
  },
  "hash": {
    "apikey": "SUA_API_KEY_AQUI"
  },
  "qrcode": {
    "code": "data:image/png;base64,..."
  }
}
```

---

## Passo 8: Conectar WhatsApp (Escanear QR Code)

### Obter QR Code

```powershell
$headers = @{
    "apikey" = "SUA_API_KEY_AQUI"
}

Invoke-RestMethod -Uri "http://localhost:8080/instance/connect/louvorapp-dev" `
    -Method GET `
    -Headers $headers
```

A resposta terá um campo `qrcode.base64` com a imagem do QR Code em base64.

### Escanear QR Code

**Opção 1: Copiar base64 e colar no navegador**
1. Copie o conteúdo de `qrcode.base64`
2. Cole na barra de endereços do navegador
3. Pressione Enter
4. Escaneie com seu WhatsApp (Dispositivos Vinculados > Vincular Dispositivo)

**Opção 2: Usar terminal no navegador**
1. Acesse: http://localhost:8080/docs
2. Procure por **GET /instance/connect/{instanceName}**
3. Execute e verá o QR Code renderizado

---

## Passo 9: Testar Envio de Mensagem

Após conectar o WhatsApp, teste enviar uma mensagem:

```powershell
$headers = @{
    "apikey" = "SUA_API_KEY_AQUI"
    "Content-Type" = "application/json"
}

$body = @{
    number = "5511999999999"  # Seu número no formato internacional
    text = "Teste de mensagem via Evolution API local! 🎉"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/message/sendText/louvorapp-dev" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

Se você receber a mensagem no WhatsApp, **está funcionando!** ✅

---

## Passo 10: Configurar Supabase com Evolution Local

### Via Dashboard Supabase

1. Acesse: https://supabase.com/dashboard/project/wajbaxzpehfkapqndfwv/settings/functions
2. Vá em **Edge Functions** > **Environment Variables**
3. Adicione uma nova variável:
   - **Nome:** `EVOLUTION_API_URL`
   - **Valor:** `http://localhost:8080` (ou use ngrok - veja abaixo)

### Problema: Supabase não consegue acessar localhost

Edge Functions rodam na nuvem da Supabase, então elas **não conseguem acessar** `http://localhost:8080`.

### Solução 1: Usar ngrok (Recomendado para Dev)

Ngrok cria um túnel público para seu localhost.

1. Baixe ngrok: https://ngrok.com/download
2. Extraia e execute:
   ```powershell
   ngrok http 8080
   ```
3. Copie a URL pública (ex: `https://abc123.ngrok.io`)
4. Configure no Supabase:
   - `EVOLUTION_API_URL` = `https://abc123.ngrok.io`

### Solução 2: Deploy Evolution em VPS/Cloud (Produção)

Para produção, você vai precisar hospedar a Evolution API em um servidor:
- VPS (DigitalOcean, Vultr, AWS EC2)
- Contabo
- Oracle Cloud (free tier)

---

## Comandos Úteis

### Parar os containers
```powershell
docker compose down
```

### Reiniciar os containers
```powershell
docker compose restart
```

### Ver logs em tempo real
```powershell
docker compose logs -f evolution-api
```

### Parar e remover tudo (limpar)
```powershell
docker compose down -v
```

### Atualizar para nova versão da Evolution
```powershell
docker compose pull
docker compose up -d
```

---

## Estrutura Final

```
LouvorApp-New/
├── evolution-api-local/
│   ├── docker-compose.yml
│   └── README.md (este arquivo)
├── supabase/
├── src/
└── ...
```

---

## Próximos Passos

Após configurar a Evolution API local:

1. ✅ Evolution rodando localmente
2. ✅ Instância criada e WhatsApp conectado
3. ✅ Teste de envio funcionando
4. 🔄 Configurar ngrok para expor publicamente
5. 🔄 Configurar `EVOLUTION_API_URL` no Supabase
6. 🔄 Testar Edge Function `send_whatsapp` completa
7. 🔄 Integrar com frontend (AgendaSection.tsx)

---

## Troubleshooting

### Erro: "Docker daemon not running"
- Abra o Docker Desktop
- Aguarde ele inicializar completamente

### Erro: "port already in use"
- Mude as portas no `docker-compose.yml`:
  ```yaml
  ports:
    - "8081:8080"  # Em vez de 8080:8080
  ```

### Erro: "WSL 2 installation is incomplete"
- Execute no PowerShell (Admin):
  ```powershell
  wsl --install
  wsl --set-default-version 2
  ```

### QR Code expirou
- Obtenha um novo:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:8080/instance/connect/louvorapp-dev" `
      -Method GET -Headers @{"apikey"="SUA_API_KEY"}
  ```

---

## Links Úteis

- **Documentação Evolution API:** https://doc.evolution-api.com/
- **Docker Desktop:** https://www.docker.com/products/docker-desktop/
- **Ngrok:** https://ngrok.com/
- **Swagger UI local:** http://localhost:8080/docs
