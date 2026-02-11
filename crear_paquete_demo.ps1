# ==========================================
# SCRIPT DE CREACIÓN DE PAQUETE DEMO (VERSIÓN ROBUSTA)
# ==========================================
$ErrorActionPreference = "Stop"

# 1. Definir rutas
$sourceDir = Get-Location
$demoDirName = "ENTREGA_DEMO"
$demoDir = Join-Path $sourceDir $demoDirName

Write-Host ">>> INICIANDO CREACION DE PAQUETE DEMO..." -ForegroundColor Cyan

# 2. Limpiar versión anterior
if (Test-Path $demoDir) {
    Write-Host "   - Borrando version anterior..." -ForegroundColor Yellow
    Remove-Item $demoDir -Recurse -Force
}
New-Item $demoDir -ItemType Directory | Out-Null
Write-Host "   - Carpeta creada." -ForegroundColor Green

# 3. Copiar carpetas
Write-Host "   - Copiando archivos..." -ForegroundColor Yellow

# Función simple de copia
Copy-Item (Join-Path $sourceDir "backend") (Join-Path $demoDir "backend") -Recurse
Copy-Item (Join-Path $sourceDir "frontend") (Join-Path $demoDir "frontend") -Recurse
Copy-Item (Join-Path $sourceDir "sql") (Join-Path $demoDir "sql") -Recurse
Copy-Item (Join-Path $sourceDir "docker-compose.yml") (Join-Path $demoDir "docker-compose.yml")

# 4. Limpiar basura (node_modules, target, etc)
Write-Host "   - Limpiando archivos basura..." -ForegroundColor Yellow
$basura = @(
    "backend\target", 
    "backend\.mvn", 
    "backend\.git", 
    "backend\.idea",
    "frontend\node_modules", 
    "frontend\dist", 
    "frontend\.angular", 
    "frontend\.git", 
    "frontend\.vscode",
    "sql\.git"
)

foreach ($item in $basura) {
    $path = Join-Path $demoDir $item
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 5. Modificar application.properties
Write-Host "   - Configurando base de datos para Docker..." -ForegroundColor Yellow
$propFile = Join-Path $demoDir "backend\src\main\resources\application.properties"
if (Test-Path $propFile) {
    $txt = Get-Content $propFile
    $txt = $txt -replace "localhost", "db"
    $txt = $txt -replace "54322", "5432"
    Set-Content $propFile $txt
}

# 6. Crear los .BAT (Sin usar Here-Strings para evitar errores)
Write-Host "   - Generando ejecutables..." -ForegroundColor Yellow

# BAT 1: INICIAR
$linesIniciar = @(
    "@echo off",
    "echo INICIANDO DEMO...",
    "docker-compose up -d --build",
    "echo Esperando 10 segundos...",
    "timeout /t 10",
    "start http://localhost",
    "pause"
)
Set-Content (Join-Path $demoDir "01_INICIAR.bat") -Value $linesIniciar -Encoding Ascii

# BAT 2: DETENER
$linesDetener = @(
    "@echo off",
    "docker-compose down",
    "echo Sistema detenido.",
    "pause"
)
Set-Content (Join-Path $demoDir "02_DETENER.bat") -Value $linesDetener -Encoding Ascii

# BAT 3: RESET
$linesReset = @(
    "@echo off",
    "echo BORRANDO DATOS...",
    "docker-compose down -v",
    "echo Listo.",
    "pause"
)
Set-Content (Join-Path $demoDir "03_REINICIAR_TODO.bat") -Value $linesReset -Encoding Ascii

# LEEME
$linesLeeme = @(
    "INSTRUCCIONES:",
    "1. Instalar Docker Desktop.",
    "2. Doble clic en 01_INICIAR.bat",
    "3. Esperar a que se abra el navegador."
)
Set-Content (Join-Path $demoDir "LEEME.txt") -Value $linesLeeme

Write-Host ">>> ¡LISTO! Carpeta creada en: $demoDir" -ForegroundColor Cyan