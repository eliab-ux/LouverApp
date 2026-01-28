# Script para criar instância no Evolution API
# Lê a API Key do arquivo credentials.txt

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Criar Instancia WhatsApp" -ForegroundColor Cyan
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
Write-Host "Criando instancia 'louvorapp-dev'..." -ForegroundColor Yellow

$headers = @{
    "apikey" = $apiKey
    "Content-Type" = "application/json"
}

$body = @{
    instanceName = "louvorapp-dev"
    qrcode = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/instance/create" `
        -Method POST `
        -Headers $headers `
        -Body $body

    Write-Host "OK Instancia criada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Detalhes da instancia:" -ForegroundColor Yellow
    Write-Host "  Nome: louvorapp-dev" -ForegroundColor White
    Write-Host "  Status: $($response.instance.status)" -ForegroundColor White
    Write-Host ""
    Write-Host "Proximo passo: Conectar WhatsApp" -ForegroundColor Yellow
    Write-Host "Execute: .\conectar-whatsapp.ps1" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "ERRO ao criar instancia:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Detalhes do erro:" -ForegroundColor Yellow
    Write-Host $_ -ForegroundColor Gray
}

Read-Host "Pressione Enter para sair"
