@echo off
echo INICIANDO DEMO...
docker-compose up -d --build
echo Esperando 10 segundos...
timeout /t 10
start http://localhost
pause
