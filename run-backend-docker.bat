@echo off
echo ========================================
echo   INICIANDO BACKEND - GESTION INGENIERIA
echo   Entorno: DOCKER (PostgreSQL)
echo ========================================
echo.

REM Navegar a la carpeta del backend
cd /d "%~dp0backend"

REM Ejecutar el backend con Maven
echo Ejecutando: mvn spring-boot:run
echo.
mvn spring-boot:run

pause
