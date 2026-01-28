#!/bin/bash

cd "$(dirname "$0")/.."

echo "📋 Logs da Evolution API (Ctrl+C para sair)..."
echo ""
docker-compose logs -f evolution-api
