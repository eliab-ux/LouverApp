# Script para criar instância de PRODUCAO no Evolution API
# Lê a API Key do arquivo credentials.txt

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Criar Instancia WhatsApp - PRODUCAO" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Ler API Key do arquivo
if (Test-Path "credentials.txt") {
    $content = Get-Content "credentials.txt" -Raw
    if ($content -match "API_KEY=(.+)") {
        $apiKey = $matches[1].Trim()
        Write-Host "API Key encontrada: $apiKey" -ForegroundColor Green
    } else {
        Write-Host "ERRO: API_KEY nao encontrada no arquivo credentials.txt" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
} else {
    Write-Host "ERRO: Arquivo credentials.txt nao encontrado" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "Criando instancia 'louvorapp' (PRODUCAO)..." -ForegroundColor Yellow

$headers = @{
    "apikey" = $apiKey
    "Content-Type" = "application/json"
}

$body = @{
    instanceName = "louvorapp"
    integration = "WHATSAPP-BAILEYS"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/instance/create" `
        -Method POST `
        -Headers $headers `
        -Body $body

    Write-Host "OK Instancia criada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Detalhes da instancia:" -ForegroundColor Yellow
    Write-Host "  Nome: louvorapp" -ForegroundColor White
    Write-Host "  Status: $($response.instance.status)" -ForegroundColor White
    Write-Host ""

    # Atualizar arquivo de credenciais
    $credContent = @"
# Evolution API - Credenciais Locais
# Gerado em: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')

API_KEY=$apiKey
EVOLUTION_URL=http://localhost:8080
INSTANCE_NAME=louvorapp

# Para usar com ngrok (apos instalar):
# ngrok http 8080
# Depois configure EVOLUTION_API_URL no Supabase com a URL do ngrok
"@
    $credContent | Out-File -FilePath "credentials.txt" -Encoding UTF8

    Write-Host "Proximo passo: Conectar WhatsApp" -ForegroundColor Yellow
    Write-Host "Execute: .\conectar-whatsapp-prod.ps1" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "ERRO ao criar instancia:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""

    if ($_.Exception.Message -like "*409*" -or $_.Exception.Message -like "*already exists*") {
        Write-Host "A instancia 'louvorapp' ja existe!" -ForegroundColor Yellow
        Write-Host "Execute: .\conectar-whatsapp-prod.ps1 para conectar" -ForegroundColor Yellow
    } else {
        Write-Host "Detalhes do erro:" -ForegroundColor Yellow
        Write-Host $_ -ForegroundColor Gray
    }
}

Read-Host "Pressione Enter para sair"
