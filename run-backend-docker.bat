@echo off
echo ========================================
echo   INICIANDO BACKEND - GESTION INGENIERIA
echo   Entorno: DOCKER (PostgreSQL)
echo ========================================
echo.
echo IMPORTANTE: Antes de ejecutar este script:
echo 1. Abre backend/src/main/resources/application.properties
echo 2. Comenta las lineas de XAMPP (MySQL)
echo 3. Descomenta las lineas de DOCKER (PostgreSQL)
echo.
pause

REM Navegar a la carpeta del backend
cd /d "%~dp0backend"

REM Ejecutar el backend con Maven
echo Ejecutando: mvn spring-boot:run
echo.
mvn spring-boot:run

pause
