# Script para adicionar Chocolatey ao PATH permanentemente
# Execute como Administrador

Write-Host "Adicionando Chocolatey ao PATH do sistema..." -ForegroundColor Yellow

$chocoPath = "C:\ProgramData\chocolatey\bin"

# Adicionar ao PATH do sistema (requer admin)
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

if ($currentPath -notlike "*$chocoPath*") {
    [Environment]::SetEnvironmentVariable(
        "Path",
        "$currentPath;$chocoPath",
        "Machine"
    )
    Write-Host "OK Chocolatey adicionado ao PATH!" -ForegroundColor Green
    Write-Host "Feche e reabra o PowerShell para usar o comando 'choco'" -ForegroundColor Yellow
} else {
    Write-Host "Chocolatey ja esta no PATH" -ForegroundColor Green
}

Write-Host ""
Read-Host "Pressione Enter para sair"
