@echo off
chcp 65001 > nul
echo ========================================
echo   GESTIÓN INGENIERÍA V2 - DOCKER
echo ========================================
echo.

REM Verificar si Docker está corriendo
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Docker Desktop no está corriendo
    echo.
    echo Por favor:
    echo 1. Abre Docker Desktop
    echo 2. Espera a que inicie completamente
    echo 3. Ejecuta este script de nuevo
    echo.
    pause
    exit /b 1
)

echo ✅ Docker Desktop está corriendo
echo.

REM Verificar si las imágenes existen
echo Verificando imágenes Docker...
docker images | findstr "gestion-backend" > nul
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Las imágenes Docker no están cargadas
    echo Cargando imágenes desde archivos .tar...
    echo.
    
    if exist backend.tar (
        echo Cargando backend.tar...
        docker load -i backend.tar
    ) else (
        echo ❌ ERROR: No se encontró backend.tar
        pause
        exit /b 1
    )
    
    if exist frontend.tar (
        echo Cargando frontend.tar...
        docker load -i frontend.tar
    ) else (
        echo ❌ ERROR: No se encontró frontend.tar
        pause
        exit /b 1
    )
    
    if exist postgres.tar (
        echo Cargando postgres.tar...
        docker load -i postgres.tar
    ) else (
        echo ❌ ERROR: No se encontró postgres.tar
        pause
        exit /b 1
    )
    
    echo.
    echo ✅ Imágenes cargadas correctamente
)

echo.
echo Iniciando servicios...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: No se pudieron iniciar los servicios
    echo Revisa los logs con: docker-compose logs
    pause
    exit /b 1
)

echo.
echo Esperando a que los servicios inicien...
timeout /t 15 /nobreak > nul

echo.
echo ========================================
echo   ✅ APLICACIÓN INICIADA
echo ========================================
echo.
echo 🌐 Frontend: http://localhost
echo 🔧 Backend:  http://localhost:8082
echo 💾 Base de datos: localhost:54322
echo.
echo 👤 Credenciales por defecto:
echo    Usuario: jefe_admin
echo    Contraseña: admin123
echo.
echo 📝 Comandos útiles:
echo    - Ver logs: docker-compose logs -f
echo    - Detener: ejecuta DETENER.bat
echo    - Reiniciar: ejecuta REINICIAR.bat
echo.
echo ========================================
echo.
echo Presiona cualquier tecla para abrir la aplicación en el navegador...
pause > nul
start http://localhost
