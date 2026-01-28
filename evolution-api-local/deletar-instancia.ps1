# Script para deletar instância

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Deletar Instancia 'louvorapp'" -ForegroundColor Cyan
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
Write-Host "Deletando instancia 'louvorapp'..." -ForegroundColor Yellow

$headers = @{
    "apikey" = $apiKey
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/instance/delete/louvorapp" `
        -Method DELETE `
        -Headers $headers

    Write-Host "OK Instancia deletada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximo passo: Criar novamente" -ForegroundColor Yellow
    Write-Host "Execute: .\criar-instancia-prod.ps1" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "ERRO ao deletar instancia:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""

    if ($_.Exception.Message -like "*404*") {
        Write-Host "A instancia 'louvorapp' nao foi encontrada." -ForegroundColor Yellow
        Write-Host "Ela pode ja ter sido deletada." -ForegroundColor Yellow
    } else {
        Write-Host "Detalhes do erro:" -ForegroundColor Yellow
        Write-Host $_ -ForegroundColor Gray
    }
}

Read-Host "Pressione Enter para sair"
