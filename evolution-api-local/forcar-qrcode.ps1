# Script para forçar geração do QR Code

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Forcar Geracao do QR Code" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Ler API Key
if (Test-Path "credentials.txt") {
    $content = Get-Content "credentials.txt" -Raw
    if ($content -match "API_KEY=(.+)") {
        $apiKey = $matches[1].Trim()
        Write-Host "API Key encontrada" -ForegroundColor Green
    } else {
        Write-Host "ERRO: API_KEY nao encontrada" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERRO: Arquivo credentials.txt nao encontrado" -ForegroundColor Red
    exit 1
}

$headers = @{
    "apikey" = $apiKey
    "Content-Type" = "application/json"
}

Write-Host ""
Write-Host "Tentativa 1: Logout da instancia..." -ForegroundColor Yellow

try {
    $logout = Invoke-RestMethod -Uri "http://localhost:8080/instance/logout/louvorapp" `
        -Method DELETE `
        -Headers $headers
    Write-Host "  Logout OK" -ForegroundColor Green
} catch {
    Write-Host "  Logout falhou (normal se nao estava conectado)" -ForegroundColor DarkGray
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Tentativa 2: Restart da instancia..." -ForegroundColor Yellow

try {
    $restart = Invoke-RestMethod -Uri "http://localhost:8080/instance/restart/louvorapp" `
        -Method PUT `
        -Headers $headers
    Write-Host "  Restart OK" -ForegroundColor Green
} catch {
    Write-Host "  Restart falhou: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Tentativa 3: Conectar com qrcode via POST..." -ForegroundColor Yellow

$bodyConnect = @{
    number = ""
} | ConvertTo-Json

try {
    $connect = Invoke-WebRequest -Uri "http://localhost:8080/instance/connect/louvorapp" `
        -Method POST `
        -Headers $headers `
        -Body $bodyConnect `
        -UseBasicParsing

    $responseObj = $connect.Content | ConvertFrom-Json

    Write-Host "  Resposta recebida:" -ForegroundColor White
    Write-Host ($responseObj | ConvertTo-Json -Depth 5) -ForegroundColor DarkGray

    if ($responseObj.base64) {
        Write-Host ""
        Write-Host "OK QR Code encontrado!" -ForegroundColor Green
        $responseObj.base64 | Out-File -FilePath "qrcode-prod.txt" -Encoding UTF8
        Write-Host "Salvando QR Code no navegador..." -ForegroundColor Yellow
        Start-Process $responseObj.base64
    } elseif ($responseObj.qrcode -and $responseObj.qrcode.base64) {
        Write-Host ""
        Write-Host "OK QR Code encontrado (via qrcode.base64)!" -ForegroundColor Green
        $responseObj.qrcode.base64 | Out-File -FilePath "qrcode-prod.txt" -Encoding UTF8
        Write-Host "Abrindo QR Code no navegador..." -ForegroundColor Yellow
        Start-Process $responseObj.qrcode.base64
    } else {
        Write-Host "  QR Code nao encontrado na resposta" -ForegroundColor Red
    }
} catch {
    Write-Host "  Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Tentativa 4: Via endpoint qrcode direto..." -ForegroundColor Yellow

try {
    $qr = Invoke-RestMethod -Uri "http://localhost:8080/instance/qrcode/louvorapp" `
        -Method GET `
        -Headers $headers

    Write-Host "  Resposta:" -ForegroundColor White
    Write-Host ($qr | ConvertTo-Json -Depth 5) -ForegroundColor DarkGray
} catch {
    Write-Host "  Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Se nenhuma tentativa funcionou:" -ForegroundColor Yellow
Write-Host "1. Verifique os logs: .\ver-logs.ps1" -ForegroundColor White
Write-Host "2. Pode ser necessario usar ngrok PRIMEIRO" -ForegroundColor White
Write-Host "   e configurar SERVER_URL com a URL publica" -ForegroundColor White
Write-Host ""

Read-Host "Pressione Enter para sair"
