#!/bin/bash

cd "$(dirname "$0")/.."

echo "🚀 Iniciando Evolution API..."
docker-compose up -d

echo ""
echo "✓ Evolution API iniciada!"
echo ""
echo "Ver logs: docker-compose logs -f"
echo "Acesse: http://localhost:8080"
