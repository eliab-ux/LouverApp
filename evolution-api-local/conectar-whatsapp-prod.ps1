# Script para conectar WhatsApp PRODUCAO e obter QR Code

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Conectar WhatsApp - PRODUCAO" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Ler API Key do arquivo
if (Test-Path "credentials.txt") {
    $content = Get-Content "credentials.txt" -Raw
    if ($content -match "API_KEY=(.+)") {
        $apiKey = $matches[1].Trim()
        Write-Host "API Key encontrada" -ForegroundColor Green
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
Write-Host "Obtendo QR Code da instancia 'louvorapp'..." -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "apikey" = $apiKey
}

try {
    # Tentar obter QR Code
    $response = Invoke-RestMethod -Uri "http://localhost:8080/instance/connect/louvorapp" `
        -Method GET `
        -Headers $headers

    # Verificar se tem QR Code
    if ($response.base64) {
        $qrBase64 = $response.base64
        Write-Host "OK QR Code obtido com sucesso!" -ForegroundColor Green
        Write-Host ""

        # Salvar em arquivo
        $qrBase64 | Out-File -FilePath "qrcode-prod.txt" -Encoding UTF8

        # Abrir no navegador
        Write-Host "Abrindo QR Code no navegador..." -ForegroundColor Yellow
        Start-Process $qrBase64

        Write-Host ""
        Write-Host "=====================================" -ForegroundColor Cyan
        Write-Host "No WhatsApp (celular):" -ForegroundColor Yellow
        Write-Host "=====================================" -ForegroundColor Cyan
        Write-Host "1. Abra o WhatsApp no celular" -ForegroundColor White
        Write-Host "2. Va em Menu > Dispositivos Vinculados" -ForegroundColor White
        Write-Host "3. Toque em 'Vincular Dispositivo'" -ForegroundColor White
        Write-Host "4. Escaneie o QR Code que aparecer no navegador" -ForegroundColor White
        Write-Host ""
        Write-Host "IMPORTANTE:" -ForegroundColor Yellow
        Write-Host "- O QR Code expira em 30 segundos" -ForegroundColor White
        Write-Host "- Se expirar, execute este script novamente" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "AVISO: Resposta nao contem QR Code em base64" -ForegroundColor Yellow
        Write-Host "Resposta recebida:" -ForegroundColor Gray
        Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor DarkGray
        Write-Host ""
    }
} catch {
    Write-Host "ERRO ao obter QR Code:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""

    if ($_.Exception.Message -like "*404*") {
        Write-Host "A instancia 'louvorapp' nao foi encontrada." -ForegroundColor Yellow
        Write-Host "Execute primeiro: .\criar-instancia-prod.ps1" -ForegroundColor Yellow
    } elseif ($_.Exception.Message -like "*already*" -or $_.Exception.Message -like "*connected*") {
        Write-Host "WhatsApp ja esta conectado nesta instancia!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Para testar envio, use a API diretamente ou configure ngrok." -ForegroundColor Yellow
    } else {
        Write-Host "Detalhes do erro:" -ForegroundColor Yellow
        Write-Host $_ -ForegroundColor Gray
    }
}

Read-Host "Pressione Enter para sair"
