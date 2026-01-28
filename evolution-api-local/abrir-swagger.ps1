# Script para abrir Swagger UI da Evolution API

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Abrir Swagger UI" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Abrindo Swagger UI no navegador..." -ForegroundColor Yellow
Write-Host ""
Write-Host "URL: http://localhost:8080/manager" -ForegroundColor White
Write-Host ""

# Tentar diferentes URLs possíveis
Write-Host "Se nao abrir automaticamente, tente estas URLs:" -ForegroundColor Yellow
Write-Host "  http://localhost:8080/manager" -ForegroundColor White
Write-Host "  http://localhost:8080/api-docs" -ForegroundColor White
Write-Host "  http://localhost:8080/swagger" -ForegroundColor White
Write-Host "  http://localhost:8080/docs" -ForegroundColor White
Write-Host ""

Start-Process "http://localhost:8080/manager"

Write-Host "Instrucoes:" -ForegroundColor Yellow
Write-Host "1. No Swagger, procure pelo endpoint de conexao" -ForegroundColor White
Write-Host "2. Use sua API Key: kwXt0yuVq871cPUHEZR5FeOsLYi3WBjo" -ForegroundColor White
Write-Host "3. Conecte a instancia 'louvorapp'" -ForegroundColor White
Write-Host ""

Read-Host "Pressione Enter para sair"
