@echo off
chcp 65001 > nul
echo ========================================
echo   GESTIÓN INGENIERÍA V2 - DOCKER
echo ========================================
echo.
echo Reiniciando servicios...
echo.

docker-compose restart

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: No se pudieron reiniciar los servicios
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ SERVICIOS REINICIADOS
echo ========================================
echo.
echo Los servicios se han reiniciado correctamente.
echo.
echo 🌐 Frontend: http://localhost
echo 🔧 Backend:  http://localhost:8082
echo.
pause
