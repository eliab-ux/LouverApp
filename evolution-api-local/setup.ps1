# Script de Setup da Evolution API Local
# Execute este script no PowerShell para configurar automaticamente

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Evolution API - Setup Local" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está instalado
Write-Host "1. Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   OK Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERRO Docker nao encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instale o Docker Desktop:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Gerar API Key aleatória
Write-Host ""
Write-Host "2. Gerando API Key segura..." -ForegroundColor Yellow
$apiKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "   OK API Key gerada: $apiKey" -ForegroundColor Green

# Atualizar docker-compose.yml
Write-Host ""
Write-Host "3. Atualizando docker-compose.yml..." -ForegroundColor Yellow
$composeFile = Get-Content "docker-compose.yml" -Raw
$composeFile = $composeFile -replace "CHANGE_THIS_TO_RANDOM_STRING", $apiKey
Set-Content "docker-compose.yml" -Value $composeFile
Write-Host "   OK docker-compose.yml atualizado" -ForegroundColor Green

# Salvar API Key em arquivo
Write-Host ""
Write-Host "4. Salvando credenciais..." -ForegroundColor Yellow
$credContent = @"
# Evolution API - Credenciais Locais
# Gerado em: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')

API_KEY=$apiKey
EVOLUTION_URL=http://localhost:8080
INSTANCE_NAME=louvorapp-dev

# Para usar com ngrok (apos instalar):
# ngrok http 8080
# Depois configure EVOLUTION_API_URL no Supabase com a URL do ngrok
"@
$credContent | Out-File -FilePath "credentials.txt" -Encoding UTF8
Write-Host "   OK Credenciais salvas em: credentials.txt" -ForegroundColor Green

# Iniciar containers
Write-Host ""
Write-Host "5. Iniciando containers Docker..." -ForegroundColor Yellow
Write-Host "   (Isso pode demorar alguns minutos na primeira vez)" -ForegroundColor Gray
docker compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "   OK Containers iniciados com sucesso!" -ForegroundColor Green

    # Aguardar API inicializar
    Write-Host ""
    Write-Host "6. Aguardando Evolution API inicializar..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   OK Evolution API esta rodando!" -ForegroundColor Green
    } catch {
        Write-Host "   AVISO API ainda esta inicializando (isso e normal)" -ForegroundColor Yellow
        Write-Host "     Aguarde 30 segundos e teste: http://localhost:8080" -ForegroundColor Gray
    }

    # Exibir resumo
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "OK Setup Completo!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Credenciais:" -ForegroundColor Yellow
    Write-Host "  API Key: $apiKey" -ForegroundColor White
    Write-Host "  URL: http://localhost:8080" -ForegroundColor White
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Yellow
    Write-Host "  1. Acesse: http://localhost:8080/docs" -ForegroundColor White
    Write-Host "  2. Crie uma instancia usando a API Key acima" -ForegroundColor White
    Write-Host "  3. Conecte seu WhatsApp escaneando o QR Code" -ForegroundColor White
    Write-Host ""
    Write-Host "Para expor publicamente (necessario para Supabase):" -ForegroundColor Yellow
    Write-Host "  1. Instale ngrok: https://ngrok.com/download" -ForegroundColor White
    Write-Host "  2. Execute: ngrok http 8080" -ForegroundColor White
    Write-Host "  3. Configure EVOLUTION_API_URL no Supabase com a URL do ngrok" -ForegroundColor White
    Write-Host ""
    Write-Host "Comandos uteis:" -ForegroundColor Yellow
    Write-Host "  Ver logs: docker compose logs -f evolution-api" -ForegroundColor White
    Write-Host "  Parar: docker compose down" -ForegroundColor White
    Write-Host "  Reiniciar: docker compose restart" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "   ERRO ao iniciar containers" -ForegroundColor Red
    Write-Host "   Execute 'docker compose logs' para ver os logs" -ForegroundColor Yellow
}

Read-Host "Pressione Enter para sair"
