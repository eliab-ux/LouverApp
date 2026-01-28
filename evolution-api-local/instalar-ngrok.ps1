# Script para baixar e instalar ngrok diretamente

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Instalar ngrok" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$ngrokUrl = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
$downloadPath = "$env:TEMP\ngrok.zip"
$extractPath = "$env:USERPROFILE\ngrok"

Write-Host "Baixando ngrok..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $ngrokUrl -OutFile $downloadPath

Write-Host "Extraindo para $extractPath..." -ForegroundColor Yellow
if (Test-Path $extractPath) {
    Remove-Item $extractPath -Recurse -Force
}
Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force

Write-Host ""
Write-Host "OK ngrok instalado em: $extractPath" -ForegroundColor Green
Write-Host ""
Write-Host "Para executar ngrok:" -ForegroundColor Yellow
Write-Host "  cd $extractPath" -ForegroundColor White
Write-Host "  .\ngrok.exe http 8080" -ForegroundColor White
Write-Host ""

# Limpar arquivo temporário
Remove-Item $downloadPath -Force

Read-Host "Pressione Enter para sair"
