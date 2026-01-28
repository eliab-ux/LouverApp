# Script para conectar WhatsApp e obter QR Code
# Lê a API Key do arquivo credentials.txt

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Conectar WhatsApp - QR Code" -ForegroundColor Cyan
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
Write-Host "Obtendo QR Code da instancia 'louvorapp-dev'..." -ForegroundColor Yellow

$headers = @{
    "apikey" = $apiKey
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/instance/connect/louvorapp-dev" `
        -Method GET `
        -Headers $headers

    Write-Host "OK QR Code obtido com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "Como escanear o QR Code:" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Opcao 1 - Via Navegador (RECOMENDADO):" -ForegroundColor Yellow
    Write-Host "  1. Acesse: http://localhost:8080/docs" -ForegroundColor White
    Write-Host "  2. Procure por: GET /instance/connect/{instanceName}" -ForegroundColor White
    Write-Host "  3. Clique em 'Try it out'" -ForegroundColor White
    Write-Host "  4. Digite: louvorapp-dev" -ForegroundColor White
    Write-Host "  5. Clique em 'Execute'" -ForegroundColor White
    Write-Host "  6. Escaneie o QR Code que aparecer" -ForegroundColor White
    Write-Host ""
    Write-Host "Opcao 2 - Via base64 (se souber usar):" -ForegroundColor Yellow
    Write-Host "  O QR Code em base64 esta salvo em: qrcode.txt" -ForegroundColor White

    # Salvar QR Code em arquivo
    if ($response.qrcode.base64) {
        $response.qrcode.base64 | Out-File -FilePath "qrcode.txt" -Encoding UTF8
        Write-Host ""
        Write-Host "  Cole o conteudo de qrcode.txt no navegador para ver a imagem" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "No WhatsApp:" -ForegroundColor Yellow
    Write-Host "  1. Abra o WhatsApp no celular" -ForegroundColor White
    Write-Host "  2. Va em Menu > Dispositivos Vinculados" -ForegroundColor White
    Write-Host "  3. Toque em 'Vincular Dispositivo'" -ForegroundColor White
    Write-Host "  4. Escaneie o QR Code" -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANTE: O QR Code expira em 30 segundos!" -ForegroundColor Yellow
    Write-Host "Se expirar, execute este script novamente." -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "ERRO ao obter QR Code:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""

    if ($_.Exception.Message -like "*404*") {
        Write-Host "A instancia 'louvorapp-dev' nao foi encontrada." -ForegroundColor Yellow
        Write-Host "Execute primeiro: .\criar-instancia.ps1" -ForegroundColor Yellow
    }
}

Read-Host "Pressione Enter para sair"
