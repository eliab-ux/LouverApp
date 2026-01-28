# Script para conectar WhatsApp - Versão 2
# Usa endpoint correto baseado na estrutura da API

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Conectar WhatsApp - PRODUCAO v2" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Ler API Key do arquivo
if (Test-Path "credentials.txt") {
    $content = Get-Content "credentials.txt" -Raw
    if ($content -match "API_KEY=(.+)") {
        $apiKey = $matches[1].Trim()
        Write-Host "API Key encontrada" -ForegroundColor Green
    } else {
        Write-Host "ERRO: API_KEY nao encontrada" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
} else {
    Write-Host "ERRO: Arquivo credentials.txt nao encontrado" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "Tentando conectar instancia 'louvorapp'..." -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "apikey" = $apiKey
}

try {
    # Tentar endpoint de restart que pode gerar QR Code
    Write-Host "1. Tentando reiniciar instancia para gerar QR Code..." -ForegroundColor Gray

    try {
        $restart = Invoke-RestMethod -Uri "http://localhost:8080/instance/restart/louvorapp" `
            -Method PUT `
            -Headers $headers
        Write-Host "   Instancia reiniciada" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "   Restart falhou (normal se instancia esta parada)" -ForegroundColor DarkGray
    }

    Write-Host ""
    Write-Host "2. Obtendo status de conexao..." -ForegroundColor Gray

    $status = Invoke-RestMethod -Uri "http://localhost:8080/instance/connectionState/louvorapp" `
        -Method GET `
        -Headers $headers

    Write-Host "   Status:" -ForegroundColor White
    Write-Host ($status | ConvertTo-Json -Depth 5) -ForegroundColor DarkGray
    Write-Host ""

    # Se tem base64, mostrar QR Code
    if ($status.base64) {
        Write-Host "OK QR Code encontrado!" -ForegroundColor Green
        Write-Host ""

        $qrBase64 = $status.base64
        $qrBase64 | Out-File -FilePath "qrcode-prod.txt" -Encoding UTF8

        Write-Host "Abrindo QR Code no navegador..." -ForegroundColor Yellow
        Start-Process $qrBase64

        Write-Host ""
        Write-Host "=====================================" -ForegroundColor Cyan
        Write-Host "No WhatsApp (celular):" -ForegroundColor Yellow
        Write-Host "=====================================" -ForegroundColor Cyan
        Write-Host "1. Abra WhatsApp no celular" -ForegroundColor White
        Write-Host "2. Menu > Dispositivos Vinculados" -ForegroundColor White
        Write-Host "3. Vincular Dispositivo" -ForegroundColor White
        Write-Host "4. Escaneie o QR Code" -ForegroundColor White
        Write-Host ""
        Write-Host "IMPORTANTE: QR Code expira em 30 segundos!" -ForegroundColor Yellow
        Write-Host ""
    } elseif ($status.state -eq "open") {
        Write-Host "WhatsApp JA ESTA CONECTADO!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Numero conectado: $($status.number)" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "AVISO: Nao foi possivel obter QR Code" -ForegroundColor Yellow
        Write-Host "Resposta da API:" -ForegroundColor Gray
        Write-Host ($status | ConvertTo-Json -Depth 5) -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "Vamos tentar metodo alternativo..." -ForegroundColor Yellow
        Write-Host ""

        # Método alternativo: usar endpoint connect
        try {
            $connect = Invoke-RestMethod -Uri "http://localhost:8080/instance/connect/louvorapp" `
                -Method GET `
                -Headers $headers

            if ($connect.base64) {
                Write-Host "OK QR Code obtido via metodo alternativo!" -ForegroundColor Green
                $connect.base64 | Out-File -FilePath "qrcode-prod.txt" -Encoding UTF8
                Start-Process $connect.base64
            } else {
                Write-Host "Resposta do connect:" -ForegroundColor Gray
                Write-Host ($connect | ConvertTo-Json -Depth 5) -ForegroundColor DarkGray
            }
        } catch {
            Write-Host "Metodo alternativo tambem falhou" -ForegroundColor Red
        }
    }

} catch {
    Write-Host "ERRO:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Detalhes:" -ForegroundColor Yellow
    Write-Host $_ -ForegroundColor Gray
}

Write-Host ""
Read-Host "Pressione Enter para sair"
