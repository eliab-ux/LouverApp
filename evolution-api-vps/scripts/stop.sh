#!/bin/bash

cd "$(dirname "$0")/.."

echo "⏹️  Parando Evolution API..."
docker-compose down

echo ""
echo "✓ Evolution API parada!"
