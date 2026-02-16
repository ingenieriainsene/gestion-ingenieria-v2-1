@echo off
chcp 65001 > nul
echo ========================================
echo   GESTIÓN INGENIERÍA V2 - DOCKER
echo ========================================
echo.
echo Deteniendo servicios...
docker-compose down

if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Hubo un problema al detener los servicios
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ SERVICIOS DETENIDOS
echo ========================================
echo.
echo Los servicios se han detenido correctamente.
echo.
echo 💾 Los datos se han guardado y estarán disponibles
echo    la próxima vez que ejecutes INICIAR.bat
echo.
echo 📝 Para eliminar todos los datos (reset completo):
echo    ejecuta LIMPIAR.bat
echo.
pause
