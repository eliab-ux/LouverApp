# Evolution API - Pacote para VPS

Pacote completo para subir a **Evolution API** na sua VPS com PostgreSQL e Redis.

## 📋 Pré-requisitos

Na sua VPS, você precisa ter instalado:

- ✅ **Docker** (versão 20.10+)
- ✅ **Docker Compose** (versão 2.0+)
- ✅ **PostgreSQL** (já instalado - conforme informado)

## 📦 Arquivos do Pacote

```
evolution-api-vps/
├── docker-compose.yml    # Configuração dos containers
├── .env.example          # Exemplo de variáveis de ambiente
├── .env                  # Suas configurações (criar este arquivo)
├── README.md             # Este arquivo
└── scripts/
    ├── install.sh        # Script de instalação
    ├── start.sh          # Iniciar Evolution API
    ├── stop.sh           # Parar Evolution API
    ├── logs.sh           # Ver logs
    └── backup.sh         # Backup dos dados
```

## 🚀 Instalação na VPS

### Passo 1: Enviar arquivos para a VPS

**Opção A: Usando SCP (do seu computador)**
```bash
# Compactar a pasta
cd c:\HD\Eliab\LouvorApp-New
tar -czf evolution-api-vps.tar.gz evolution-api-vps/

# Enviar para VPS (substitua USER e IP)
scp evolution-api-vps.tar.gz user@SEU_IP_VPS:/home/user/

# Conectar na VPS via SSH
ssh user@SEU_IP_VPS

# Descompactar
cd /home/user
tar -xzf evolution-api-vps.tar.gz
cd evolution-api-vps
```

**Opção B: Usando Git (se tiver repositório)**
```bash
ssh user@SEU_IP_VPS
cd /home/user
git clone seu-repositorio
cd evolution-api-vps
```

**Opção C: Copiar e colar (via Cockpit)**
1. Acesse Cockpit → Terminal
2. Crie a pasta: `mkdir -p ~/evolution-api`
3. Copie os arquivos manualmente via interface do Cockpit

### Passo 2: Criar banco de dados PostgreSQL

```bash
# Conectar no PostgreSQL
sudo -u postgres psql

# Criar banco de dados
CREATE DATABASE evolution_api;

# Criar usuário (opcional - ou use o postgres existente)
CREATE USER evolution WITH PASSWORD 'sua_senha_segura';

# Dar permissões
GRANT ALL PRIVILEGES ON DATABASE evolution_api TO evolution;

# Sair
\q
```

### Passo 3: Configurar variáveis de ambiente

```bash
cd ~/evolution-api-vps

# Copiar o exemplo
cp .env.example .env

# Editar o arquivo .env
nano .env
```

**Configure os valores:**
```env
EVOLUTION_API_KEY=cole_uma_chave_forte_aqui
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evolution_api
DB_USER=postgres  # ou 'evolution' se criou o usuário
DB_PASSWORD=sua_senha_do_postgres
```

**Para gerar uma chave forte:**
```bash
openssl rand -base64 32
```

### Passo 4: Configurar SERVER_URL no docker-compose.yml

Edite o arquivo `docker-compose.yml`:
```bash
nano docker-compose.yml
```

Altere a linha:
```yaml
SERVER_URL: http://SEU_IP_OU_DOMINIO:8080
```

**Exemplos:**
- Com IP: `http://123.456.78.90:8080`
- Com domínio: `https://evolution.seudominio.com.br`

### Passo 5: Subir a Evolution API

```bash
# Dar permissão de execução nos scripts
chmod +x scripts/*.sh

# Iniciar
./scripts/start.sh

# OU manualmente:
docker-compose up -d
```

### Passo 6: Verificar se está funcionando

```bash
# Ver logs
docker-compose logs -f evolution-api

# Ou usar o script:
./scripts/logs.sh

# Verificar containers rodando
docker ps
```

**Teste via navegador:**
```
http://SEU_IP_VPS:8080
```

Você deve ver a documentação Swagger da Evolution API.

## 🔧 Comandos Úteis

### Gerenciar Evolution API

```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Reiniciar
docker-compose restart

# Ver logs em tempo real
docker-compose logs -f evolution-api

# Ver logs do Redis
docker-compose logs -f redis

# Status dos containers
docker-compose ps
```

### Testar a API

**1. Criar uma instância do WhatsApp:**
```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: SUA_CHAVE_API" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "teste",
    "qrcode": true
  }'
```

**2. Verificar status:**
```bash
curl -X GET http://localhost:8080/instance/connectionState/teste \
  -H "apikey: SUA_CHAVE_API"
```

## 🔐 Configurar HTTPS com Nginx (Recomendado)

Se você quiser acessar via HTTPS:

### 1. Instalar Nginx

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 2. Criar configuração Nginx

```bash
sudo nano /etc/nginx/sites-available/evolution-api
```

Cole:
```nginx
server {
    listen 80;
    server_name evolution.seudominio.com.br;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Ativar e obter SSL

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/evolution-api /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar nginx
sudo systemctl restart nginx

# Obter certificado SSL (Let's Encrypt)
sudo certbot --nginx -d evolution.seudominio.com.br
```

### 4. Atualizar SERVER_URL

Edite `docker-compose.yml` e altere:
```yaml
SERVER_URL: https://evolution.seudominio.com.br
```

Reinicie:
```bash
docker-compose restart
```

## 🔥 Firewall

Liberar porta 8080 (se usar diretamente) ou 80/443 (se usar Nginx):

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 8080/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ou Firewalld (CentOS/RedHat)
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

## 📊 Monitoramento

### Ver uso de recursos

```bash
# Containers
docker stats

# Logs de erro
docker-compose logs --tail=100 evolution-api | grep -i error
```

### Cockpit

Acesse seu Cockpit e vá em:
- **Containers** → Ver evolution-api rodando
- **Logs** → Ver logs em tempo real

## 🔄 Backup

### Backup manual

```bash
# Backup dos volumes
docker run --rm \
  -v evolution_instances:/source \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/instances-$(date +%Y%m%d).tar.gz -C /source .

# Backup do banco PostgreSQL
pg_dump -U postgres evolution_api > evolution_api_backup_$(date +%Y%m%d).sql
```

### Restaurar backup

```bash
# Restaurar volumes
docker run --rm \
  -v evolution_instances:/target \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/instances-YYYYMMDD.tar.gz -C /target

# Restaurar banco
psql -U postgres evolution_api < evolution_api_backup_YYYYMMDD.sql
```

## 🆘 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs evolution-api

# Verificar se PostgreSQL está acessível
docker-compose exec evolution-api nc -zv localhost 5432
```

### Erro de conexão com banco

```bash
# Testar conexão do container com PostgreSQL da VPS
docker run --rm --network host postgres:15 \
  psql -h localhost -U postgres -d evolution_api -c "SELECT 1;"
```

### Resetar tudo (CUIDADO!)

```bash
# Parar e remover tudo
docker-compose down -v

# Recriar
docker-compose up -d
```

## 📞 Suporte

Documentação oficial: https://doc.evolution-api.com

## 🔗 Integração com LouvorApp

Após a Evolution API estar rodando, configure no Supabase:

```env
EVOLUTION_API_URL=https://evolution.seudominio.com.br
EVOLUTION_API_KEY=sua_chave_api
```

E execute a migration:
```bash
supabase/migrations/20251231_add_whatsapp_support.sql
```
