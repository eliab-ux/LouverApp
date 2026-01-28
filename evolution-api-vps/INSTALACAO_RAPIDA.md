# 🚀 Instalação Rápida - Evolution API na VPS

## Resposta à sua pergunta:

**Você DEVE criar o banco manualmente!** O Docker NÃO cria o banco automaticamente.

A Evolution API só cria as **tabelas** dentro do banco que já existe.

---

## Passo a Passo Completo

### 1️⃣ Enviar arquivos para VPS

**Do seu computador Windows:**
```powershell
# Na pasta do projeto
cd c:\HD\Eliab\LouvorApp-New

# Comprimir pasta
tar -czf evolution-api-vps.tar.gz evolution-api-vps/

# Enviar para VPS (substitua USER e IP)
scp evolution-api-vps.tar.gz user@SEU_IP:/home/user/
```

**Na VPS (via SSH ou Terminal do Cockpit):**
```bash
cd /home/user
tar -xzf evolution-api-vps.tar.gz
cd evolution-api-vps
```

### 2️⃣ Criar banco de dados PostgreSQL

**Opção A: Usando o script automático (RECOMENDADO)**
```bash
chmod +x scripts/create-database.sh
./scripts/create-database.sh
```

**Opção B: Manualmente**
```bash
# Conectar no PostgreSQL
sudo -u postgres psql

# Criar banco
CREATE DATABASE evolution_api;

# Dar permissões ao usuário postgres
GRANT ALL PRIVILEGES ON DATABASE evolution_api TO postgres;

# Sair
\q
```

### 3️⃣ Configurar .env

```bash
# Copiar exemplo
cp .env.example .env

# Editar
nano .env
```

**Preencher:**
```env
EVOLUTION_API_KEY=sua_chave_forte_aqui
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evolution_api
DB_USER=postgres
DB_PASSWORD=sua_senha_postgres
```

**Gerar chave forte:**
```bash
openssl rand -base64 32
```

### 4️⃣ Configurar IP/Domínio

**Editar docker-compose.yml:**
```bash
nano docker-compose.yml
```

**Alterar linha:**
```yaml
SERVER_URL: http://SEU_IP:8080
```

**Exemplo:**
- `http://192.168.1.100:8080`
- `https://evolution.seudominio.com.br`

### 5️⃣ Liberar porta no Firewall

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 8080/tcp
sudo ufw status

# Ou Firewalld
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

### 6️⃣ Iniciar Evolution API

```bash
# Dar permissão aos scripts
chmod +x scripts/*.sh

# Iniciar
./scripts/start.sh

# OU manualmente:
docker-compose up -d
```

### 7️⃣ Verificar se funcionou

```bash
# Ver logs
./scripts/logs.sh

# OU
docker-compose logs -f

# Verificar status
docker ps
```

**Testar no navegador:**
```
http://SEU_IP_VPS:8080
```

Você deve ver a documentação Swagger da Evolution API!

---

## ✅ Teste Rápido da API

**Criar instância WhatsApp:**
```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: SUA_CHAVE_API" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "teste", "qrcode": true}'
```

**Ver QR Code no response** e escanear com WhatsApp!

---

## 🛠️ Comandos Úteis

```bash
# Iniciar
./scripts/start.sh

# Parar
./scripts/stop.sh

# Ver logs
./scripts/logs.sh

# Reiniciar
docker-compose restart

# Ver status
docker ps
```

---

## ❌ Troubleshooting

### Erro: "database does not exist"
➡️ Você esqueceu de criar o banco! Execute o Passo 2.

### Erro: "connection refused PostgreSQL"
➡️ Verifique se PostgreSQL está rodando:
```bash
sudo systemctl status postgresql
```

### Container não inicia
➡️ Ver logs:
```bash
docker-compose logs evolution-api
```

### Porta 8080 já em uso
➡️ Alterar porta no docker-compose.yml:
```yaml
ports:
  - "8081:8080"  # Muda para 8081
```

---

## 📞 Próximos Passos

Depois de funcionar, configure no LouvorApp:

1. Acesse **Supabase** → **Settings** → **Edge Functions**
2. Adicione as variáveis:
   ```
   EVOLUTION_API_URL=http://SEU_IP:8080
   EVOLUTION_API_KEY=sua_chave
   ```
3. Execute a migration: `20251231_add_whatsapp_support.sql`

---

## 🔗 Links Úteis

- Documentação: https://doc.evolution-api.com
- Swagger Local: http://SEU_IP:8080
