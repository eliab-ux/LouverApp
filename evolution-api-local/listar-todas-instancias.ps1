# Script para listar todas as instâncias

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Listar Todas as Instancias" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Ler API Key do arquivo
if (Test-Path "credentials.txt") {
    $content = Get-Content "credentials.txt" -Raw
    if ($content -match "API_KEY=(.+)") {
        $apiKey = $matches[1].Trim()
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

$headers = @{
    "apikey" = $apiKey
}

try {
    Write-Host "Consultando todas as instancias..." -ForegroundColor Yellow
    Write-Host ""

    # Tentar sem filtro de instanceName
    $response = Invoke-RestMethod -Uri "http://localhost:8080/instance/fetchInstances" `
        -Method GET `
        -Headers $headers

    Write-Host "Resposta completa:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White
    Write-Host ""

    if ($response -is [Array] -and $response.Count -gt 0) {
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host "Total de instancias: $($response.Count)" -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor Green

        foreach ($item in $response) {
            $instance = $item.instance
            Write-Host ""
            Write-Host "Nome: $($instance.instanceName)" -ForegroundColor White
            Write-Host "Status: $($instance.status)" -ForegroundColor White
            Write-Host "Integration: $($instance.integration)" -ForegroundColor White
            Write-Host "State: $($instance.state)" -ForegroundColor White
            Write-Host "---" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "Nenhuma instancia encontrada" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERRO ao consultar instancias:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Detalhes:" -ForegroundColor Yellow
    Write-Host $_ -ForegroundColor Gray
}

Write-Host ""
Read-Host "Pressione Enter para sair"
