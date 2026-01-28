# Script para ver logs recentes da Evolution API

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Logs da Evolution API (ultimos 100)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

docker compose logs evolution-api --tail 100

Write-Host ""
Read-Host "Pressione Enter para sair"
