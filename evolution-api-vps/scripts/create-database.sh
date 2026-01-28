#!/bin/bash

# ========================================
# CRIAR BANCO DE DADOS PARA EVOLUTION API
# ========================================

echo "🗄️  Criando banco de dados para Evolution API..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ler variáveis do .env se existir
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
    echo -e "${GREEN}✓${NC} Arquivo .env encontrado"
else
    echo -e "${YELLOW}⚠${NC}  Arquivo .env não encontrado. Usando valores padrão..."
    DB_NAME="evolution_api"
    DB_USER="postgres"
fi

echo ""
echo "Configuração:"
echo "  Banco: ${DB_NAME}"
echo "  Usuário: ${DB_USER}"
echo ""

# Perguntar senha do postgres
echo -e "${YELLOW}Digite a senha do usuário PostgreSQL 'postgres':${NC}"
read -s POSTGRES_PASSWORD

echo ""
echo "Criando banco de dados..."

# Criar banco de dados
PGPASSWORD=$POSTGRES_PASSWORD psql -U postgres -h localhost -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Banco de dados '${DB_NAME}' criado com sucesso!"
else
    echo -e "${YELLOW}⚠${NC}  Banco já existe ou erro ao criar. Verificando..."

    # Verificar se banco existe
    DB_EXISTS=$(PGPASSWORD=$POSTGRES_PASSWORD psql -U postgres -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';")

    if [ "$DB_EXISTS" = "1" ]; then
        echo -e "${GREEN}✓${NC} Banco '${DB_NAME}' já existe. Tudo certo!"
    else
        echo -e "${RED}✗${NC} Erro ao criar banco. Verifique as credenciais."
        exit 1
    fi
fi

# Opcional: criar usuário específico para Evolution
echo ""
echo -e "${YELLOW}Deseja criar um usuário específico para Evolution? (s/n)${NC}"
read CREATE_USER

if [ "$CREATE_USER" = "s" ] || [ "$CREATE_USER" = "S" ]; then
    echo "Digite o nome do usuário (padrão: evolution):"
    read EVOLUTION_USER
    EVOLUTION_USER=${EVOLUTION_USER:-evolution}

    echo "Digite a senha para o usuário ${EVOLUTION_USER}:"
    read -s EVOLUTION_PASSWORD

    echo ""
    echo "Criando usuário..."

    PGPASSWORD=$POSTGRES_PASSWORD psql -U postgres -h localhost <<EOF
CREATE USER ${EVOLUTION_USER} WITH PASSWORD '${EVOLUTION_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${EVOLUTION_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${EVOLUTION_USER};
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Usuário '${EVOLUTION_USER}' criado com sucesso!"
        echo ""
        echo -e "${YELLOW}IMPORTANTE:${NC} Atualize o arquivo .env com:"
        echo "  DB_USER=${EVOLUTION_USER}"
        echo "  DB_PASSWORD=${EVOLUTION_PASSWORD}"
    else
        echo -e "${YELLOW}⚠${NC}  Usuário pode já existir. Continuando..."
    fi
fi

echo ""
echo -e "${GREEN}✓${NC} Configuração do banco concluída!"
echo ""
echo "Próximos passos:"
echo "  1. Configure o arquivo .env"
echo "  2. Execute: docker-compose up -d"
