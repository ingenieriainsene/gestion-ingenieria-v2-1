# 🚀 Gestión Ingeniería V2 - Paquete de Despliegue

## 📋 Contenido del Paquete

Este paquete contiene todo lo necesario para desplegar la aplicación en cualquier PC o servidor.

### Archivos Incluidos

- `docker-compose.yml` - Configuración de Docker
- `.env` - Variables de entorno
- `INICIAR.bat` - Script para iniciar la aplicación
- `DETENER.bat` - Script para detener la aplicación
- `REINICIAR.bat` - Script para reiniciar la aplicación
- `LIMPIAR.bat` - Script para reset completo (elimina datos)
- `sql/ddl_ingenieria.sql` - Esquema de base de datos
- `backend.tar` - Imagen Docker del backend (se genera)
- `frontend.tar` - Imagen Docker del frontend (se genera)
- `postgres.tar` - Imagen Docker de PostgreSQL (se genera)

---

## 🎯 Requisitos

### En el PC de Desarrollo (para crear el paquete)
- Docker Desktop instalado
- Código fuente del proyecto

### En el PC Destino (para desplegar)
- **SOLO** Docker Desktop instalado
- Nada más (ni Java, ni Node.js, ni PostgreSQL)

---

## 📦 PASO 1: Crear el Paquete (PC de Desarrollo)

### 1.1 Construir las Imágenes Docker

Abre PowerShell en el directorio raíz del proyecto:

```powershell
cd C:\Users\Usuario\Desktop\gestion-ingenieria-v2

# Construir las imágenes
docker-compose build
```

### 1.2 Exportar las Imágenes

```powershell
# Navega a la carpeta de despliegue
cd PruebaDespliegue

# Exporta las imágenes a archivos .tar
docker save -o backend.tar gestion-ingenieria-v2-backend:latest
docker save -o frontend.tar gestion-ingenieria-v2-frontend:latest
docker save -o postgres.tar postgres:15-alpine
```

### 1.3 Verificar el Contenido

Asegúrate de que la carpeta `PruebaDespliegue` contiene:
- ✅ docker-compose.yml
- ✅ .env
- ✅ INICIAR.bat
- ✅ DETENER.bat
- ✅ REINICIAR.bat
- ✅ LIMPIAR.bat
- ✅ sql/ddl_ingenieria.sql
- ✅ backend.tar (archivo grande, ~500MB)
- ✅ frontend.tar (archivo grande, ~200MB)
- ✅ postgres.tar (archivo grande, ~100MB)

### 1.4 Comprimir el Paquete

```powershell
# Vuelve al directorio padre
cd ..

# Comprime la carpeta completa
Compress-Archive -Path PruebaDespliegue\* -DestinationPath gestion-ingenieria-deploy.zip
```

**Resultado**: Tendrás un archivo `gestion-ingenieria-deploy.zip` de aproximadamente 800MB-1GB.

---

## 🖥️ PASO 2: Desplegar en el PC Destino

### 2.1 Requisitos Previos

1. **Instalar Docker Desktop**
   - Descarga desde: https://www.docker.com/products/docker-desktop
   - Instala y reinicia el PC si es necesario
   - Abre Docker Desktop y espera a que inicie completamente

### 2.2 Transferir el Paquete

Copia el archivo `gestion-ingenieria-deploy.zip` al PC destino usando:
- USB
- Red compartida
- Correo electrónico (si es pequeño)
- Servicio en la nube (Google Drive, OneDrive, etc.)

### 2.3 Descomprimir

```powershell
# Descomprime el paquete
Expand-Archive -Path gestion-ingenieria-deploy.zip -DestinationPath C:\gestion-ingenieria
```

### 2.4 Iniciar la Aplicación

1. Abre la carpeta `C:\gestion-ingenieria`
2. **Doble clic en `INICIAR.bat`**
3. Espera 1-2 minutos mientras:
   - Se cargan las imágenes Docker
   - Se inician los servicios
   - Se crea la base de datos

### 2.5 Acceder a la Aplicación

Cuando veas el mensaje "✅ APLICACIÓN INICIADA":
- Abre el navegador en: **http://localhost**
- Usuario: `jefe_admin`
- Contraseña: `admin123`

---

## 🔧 Uso Diario

### Iniciar la Aplicación
```
Doble clic en: INICIAR.bat
```

### Detener la Aplicación
```
Doble clic en: DETENER.bat
```

### Reiniciar la Aplicación
```
Doble clic en: REINICIAR.bat
```

### Reset Completo (Eliminar Datos)
```
Doble clic en: LIMPIAR.bat
```
⚠️ **Advertencia**: Esto eliminará TODOS los datos.

---

## ⚙️ Configuración Avanzada

### Cambiar Puertos

Si los puertos por defecto están ocupados, edita el archivo `.env`:

```env
FRONTEND_PORT=8080    # Cambia el puerto del frontend
BACKEND_PORT=8082     # Cambia el puerto del backend
DB_PORT_HOST=54322    # Cambia el puerto de PostgreSQL
```

Luego reinicia:
```
DETENER.bat
INICIAR.bat
```

### Cambiar Credenciales de Base de Datos

Edita el archivo `.env`:

```env
DB_USER=mi_usuario
DB_PASSWORD=mi_contraseña_segura
DB_NAME=gestion_ingenieria
```

⚠️ **Importante**: Si cambias las credenciales después de la primera ejecución, necesitas hacer un reset completo con `LIMPIAR.bat`.

---

## 🚨 Solución de Problemas

### Error: "Docker Desktop no está corriendo"

**Solución**:
1. Abre Docker Desktop
2. Espera a que el icono de Docker en la barra de tareas deje de parpadear
3. Ejecuta `INICIAR.bat` de nuevo

### Error: "Puerto ya en uso"

**Problema**: Otro programa está usando el puerto 80 o 8082.

**Solución**:
1. Edita `.env` y cambia los puertos:
   ```env
   FRONTEND_PORT=8080
   BACKEND_PORT=8083
   ```
2. Ejecuta `INICIAR.bat`
3. Accede a `http://localhost:8080`

### La aplicación no carga

**Solución**:
1. Abre PowerShell en la carpeta de despliegue
2. Verifica el estado:
   ```powershell
   docker-compose ps
   ```
3. Revisa los logs:
   ```powershell
   docker-compose logs -f
   ```
4. Si ves errores, ejecuta:
   ```powershell
   docker-compose restart
   ```

### Reset Completo

Si nada funciona:
1. Ejecuta `LIMPIAR.bat`
2. Ejecuta `INICIAR.bat`

---

## 💾 Backup y Restauración

### Hacer Backup de la Base de Datos

```powershell
docker-compose exec db pg_dump -U postgres gestion_ingenieria > backup.sql
```

### Restaurar un Backup

```powershell
Get-Content backup.sql | docker-compose exec -T db psql -U postgres -d gestion_ingenieria
```

### Backup de Archivos Subidos

Los archivos subidos se guardan en un volumen Docker. Para hacer backup:

```powershell
docker run --rm -v gestion-ingenieria_backend_uploads:/data -v ${PWD}:/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

---

## 📊 Comandos Útiles

### Ver Estado de los Servicios
```powershell
docker-compose ps
```

### Ver Logs en Tiempo Real
```powershell
docker-compose logs -f
```

### Ver Logs de un Servicio Específico
```powershell
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Acceder a la Base de Datos
```powershell
docker-compose exec db psql -U postgres -d gestion_ingenieria
```

### Ver Uso de Recursos
```powershell
docker stats
```

---

## 🔐 Seguridad en Producción

### Cambios Recomendados para Producción

1. **Cambiar credenciales de base de datos** en `.env`
2. **Cambiar usuario y contraseña por defecto** en la aplicación
3. **Configurar HTTPS** con un reverse proxy (Nginx, Traefik)
4. **Configurar firewall** para limitar acceso
5. **Hacer backups automáticos** de la base de datos

---

## 📝 Notas Importantes

- Los datos se guardan en volúmenes Docker y persisten entre reinicios
- Para eliminar completamente la aplicación: `LIMPIAR.bat` + eliminar la carpeta
- Las imágenes Docker ocupan ~800MB-1GB de espacio en disco
- La aplicación usa aproximadamente 1-2GB de RAM cuando está corriendo

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisa esta guía
2. Verifica los logs: `docker-compose logs -f`
3. Intenta un reset completo: `LIMPIAR.bat` + `INICIAR.bat`

---

## ✅ Checklist de Despliegue

- [ ] Docker Desktop instalado y corriendo
- [ ] Paquete descomprimido
- [ ] Ejecutado `INICIAR.bat`
- [ ] Aplicación accesible en `http://localhost`
- [ ] Login exitoso con credenciales por defecto
- [ ] (Opcional) Credenciales cambiadas
- [ ] (Opcional) Puertos configurados
- [ ] (Opcional) Backup configurado
