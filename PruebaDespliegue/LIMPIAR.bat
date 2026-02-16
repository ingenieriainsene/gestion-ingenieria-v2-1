@echo off
chcp 65001 > nul
echo ========================================
echo   GESTIÓN INGENIERÍA V2 - DOCKER
echo   LIMPIEZA COMPLETA
echo ========================================
echo.
echo ⚠️  ADVERTENCIA ⚠️
echo.
echo Esta acción eliminará:
echo   - Todos los datos de la base de datos
echo   - Todos los archivos subidos
echo   - Todas las configuraciones personalizadas
echo.
echo Esta acción NO se puede deshacer.
echo.
set /p confirm="¿Estás seguro? (escribe SI para confirmar): "

if /i not "%confirm%"=="SI" (
    echo.
    echo Operación cancelada.
    pause
    exit /b 0
)

echo.
echo Deteniendo y eliminando servicios...
docker-compose down -v

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: No se pudo completar la limpieza
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ LIMPIEZA COMPLETADA
echo ========================================
echo.
echo Todos los datos han sido eliminados.
echo.
echo Para volver a usar la aplicación:
echo   1. Ejecuta INICIAR.bat
echo   2. Se creará una base de datos nueva
echo.
pause
