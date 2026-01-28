# Script para verificar status da instância

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Verificar Status da Instancia" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Ler API Key do arquivo
if (Test-Path "credentials.txt") {
    $content = Get-Content "credentials.txt" -Raw
    if ($content -match "API_KEY=(.+)") {
        $apiKey = $matches[1].Trim()
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
}

try {
    Write-Host "Consultando status da instancia 'louvorapp'..." -ForegroundColor Yellow
    Write-Host ""

    $response = Invoke-RestMethod -Uri "http://localhost:8080/instance/fetchInstances?instanceName=louvorapp" `
        -Method GET `
        -Headers $headers

    Write-Host "Resposta completa:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White
    Write-Host ""

    if ($response -is [Array] -and $response.Count -gt 0) {
        $instance = $response[0].instance
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host "Status da Instancia 'louvorapp'" -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host "Nome: $($instance.instanceName)" -ForegroundColor White
        Write-Host "Status: $($instance.status)" -ForegroundColor White
        Write-Host "Integracao: $($instance.integration)" -ForegroundColor White
        Write-Host "Estado da Conexao: $($response[0].instance.state)" -ForegroundColor White
        Write-Host ""

        if ($instance.status -eq "close" -or $response[0].instance.state -eq "close") {
            Write-Host "A instancia NAO esta conectada ao WhatsApp." -ForegroundColor Yellow
            Write-Host "Execute: .\conectar-whatsapp-prod.ps1" -ForegroundColor Yellow
        } elseif ($instance.status -eq "open" -or $response[0].instance.state -eq "open") {
            Write-Host "A instancia JA ESTA conectada ao WhatsApp!" -ForegroundColor Green
            Write-Host "Voce pode enviar mensagens usando a API." -ForegroundColor Green
        } else {
            Write-Host "Status desconhecido: $($instance.status)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Nenhuma instancia encontrada com o nome 'louvorapp'" -ForegroundColor Red
    }
} catch {
    Write-Host "ERRO ao consultar status:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Detalhes:" -ForegroundColor Yellow
    Write-Host $_ -ForegroundColor Gray
}

Write-Host ""
Read-Host "Pressione Enter para sair"
