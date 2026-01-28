# Setup Evolution API - Ambiente Local

## Pré-requisitos

- Docker instalado e rodando
- Porta 8080 disponível

## Passo 1: Subir a Evolution API

No diretório do projeto, execute:

```bash
docker-compose -f docker-compose.evolution.yml up -d
```

Aguarde alguns segundos e verifique se está rodando:

```bash
docker ps
```

Você deve ver um container chamado `evolution-api-louvorapp` rodando na porta 8080.

## Passo 2: Testar a API

Abra o navegador e acesse:

```
http://localhost:8080
```

Você deve ver a documentação da Evolution API (Swagger).

Ou teste via curl/PowerShell:

```powershell
curl http://localhost:8080
```

## Passo 3: Criar uma instância do WhatsApp (exemplo de teste)

### Via cURL (PowerShell):

```powershell
$headers = @{
    "apikey" = "louvorapp_dev_secret_key_2024"
    "Content-Type" = "application/json"
}

$body = @{
    instanceName = "igreja-teste"
    qrcode = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/instance/create" -Method POST -Headers $headers -Body $body
```

### Resposta esperada:

```json
{
  "instance": {
    "instanceName": "igreja-teste",
    "status": "created"
  },
  "qrcode": {
    "code": "data:image/png;base64,...",
    "base64": "..."
  }
}
```

## Passo 4: Conectar o WhatsApp

1. O QR Code será retornado em base64
2. Decodifique e escaneie com seu WhatsApp (WhatsApp > Aparelhos Conectados > Conectar um aparelho)
3. Após conectar, a instância ficará ativa

## Passo 5: Verificar status da instância

```powershell
$headers = @{
    "apikey" = "louvorapp_dev_secret_key_2024"
}

Invoke-RestMethod -Uri "http://localhost:8080/instance/connectionState/igreja-teste" -Method GET -Headers $headers
```

## Passo 6: Enviar mensagem de teste

```powershell
$headers = @{
    "apikey" = "louvorapp_dev_secret_key_2024"
    "Content-Type" = "application/json"
}

$body = @{
    number = "5511999999999"  # Número com código do país (55 = Brasil)
    text = "Olá! Esta é uma mensagem de teste da Evolution API."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/message/sendText/igreja-teste" -Method POST -Headers $headers -Body $body
```

## Configuração no .env.development

Adicione as seguintes variáveis no arquivo `.env.development`:

```env
VITE_SUPABASE_URL=https://bkwutpuyotlntbzwmnsk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_gfkUjxBNOy0fAI7WRL9hDw_EiaT4tKZ
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=louvorapp_dev_secret_key_2024
```

## Comandos úteis

### Ver logs da Evolution API:
```bash
docker logs -f evolution-api-louvorapp
```

### Parar a Evolution API:
```bash
docker-compose -f docker-compose.evolution.yml down
```

### Parar e remover volumes (CUIDADO: apaga dados):
```bash
docker-compose -f docker-compose.evolution.yml down -v
```

### Reiniciar a Evolution API:
```bash
docker-compose -f docker-compose.evolution.yml restart
```

## Estrutura de dados persistidos

Os dados da Evolution API ficam salvos em volumes Docker:
- `evolution_data`: Instâncias e sessões do WhatsApp
- `evolution_db`: Banco de dados SQLite

Mesmo parando o container, os dados persistem. Para migrar para produção depois, basta fazer backup desses volumes.

## Próximos passos

Depois de testar localmente:
1. Criar Edge Function `send_whatsapp` no Supabase
2. Criar migration `20251230_add_whatsapp_support.sql`
3. Atualizar Edge Functions existentes
4. Atualizar frontend

## Migração futura para VPS

Quando estiver pronto para produção:

1. Copie o arquivo `docker-compose.evolution.yml` para o servidor
2. Altere `SERVER_URL` para o IP/domínio público
3. Configure um proxy reverso (nginx) com SSL
4. Atualize as variáveis de ambiente no Supabase e frontend

## Documentação oficial

- Evolution API: https://doc.evolution-api.com
- Swagger local: http://localhost:8080
