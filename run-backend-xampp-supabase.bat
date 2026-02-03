@echo off
setlocal

REM === Configura tus credenciales de Supabase una sola vez ===
REM Reemplaza los valores entre comillas por los reales
set "APP_PROFILE=xampp"
set "DB_URL=jdbc:postgresql://TU_HOST:5432/postgres?sslmode=require"
set "DB_USER=TU_USUARIO"
set "DB_PASSWORD=TU_PASSWORD"

REM === Arranque del backend ===
cd /d "%~dp0backend"
mvn spring-boot:run

endlocal
