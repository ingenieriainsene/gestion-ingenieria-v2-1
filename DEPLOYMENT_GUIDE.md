# Guía de Despliegue - Docker

## 🐳 Despliegue con Docker

Esta guía cubre el despliegue de la aplicación usando Docker y Docker Compose con PostgreSQL.

### Requisitos
- Docker instalado
- Docker Compose instalado

---

## 🚀 Inicio Rápido

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd gestion-ingenieria-v2
```

### 2. Configurar Variables de Entorno (Opcional)

Si necesitas personalizar la configuración, crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus valores personalizados.

### 3. Levantar los Servicios

```bash
docker-compose up -d
```

Este comando:
- Descarga las imágenes necesarias (PostgreSQL, etc.)
- Construye las imágenes del backend y frontend
- Crea la base de datos y ejecuta el script de inicialización
- Levanta todos los servicios en segundo plano

### 4. Verificar el Estado

```bash
docker-compose ps
```

Deberías ver tres servicios corriendo:
- `gestion-db` (PostgreSQL)
- `gestion-backend` (Spring Boot)
- `gestion-frontend` (Angular + Nginx)

### 5. Acceder a la Aplicación

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8082
- **Base de datos**: localhost:5432

**Credenciales por defecto:**
- Usuario: `jefe_admin`
- Contraseña: `admin123`

---

## 🔧 Comandos Útiles

### Ver Logs

```bash
# Logs de todos los servicios
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Detener los Servicios

```bash
docker-compose down
```

### Detener y Eliminar Volúmenes (Limpieza Completa)

```bash
docker-compose down -v
```

⚠️ **Advertencia**: Esto eliminará todos los datos de la base de datos.

### Reconstruir las Imágenes

Si haces cambios en el código:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Reiniciar un Servicio Específico

```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart db
```

### Ejecutar Comandos en un Contenedor

```bash
# Acceder a la base de datos
docker-compose exec db psql -U postgres -d gestion_ingenieria

# Acceder al contenedor del backend
docker-compose exec backend bash

# Acceder al contenedor del frontend
docker-compose exec frontend sh
```

---

## 🗄️ Base de Datos

### Conexión desde el Host

Puedes conectarte a PostgreSQL desde tu máquina local:

```bash
psql -h localhost -p 5432 -U postgres -d gestion_ingenieria
```

**Credenciales:**
- Host: `localhost`
- Puerto: `5432`
- Usuario: `postgres`
- Contraseña: `postgres`
- Base de datos: `gestion_ingenieria`

### Backup de la Base de Datos

```bash
docker-compose exec db pg_dump -U postgres gestion_ingenieria > backup.sql
```

### Restaurar un Backup

```bash
cat backup.sql | docker-compose exec -T db psql -U postgres -d gestion_ingenieria
```

---

## 🔐 Seguridad en Producción

### Cambiar Credenciales

**IMPORTANTE**: Antes de desplegar en producción, cambia las credenciales por defecto.

1. **Base de Datos**: Edita `docker-compose.yml`
   ```yaml
   environment:
     POSTGRES_USER: tu_usuario
     POSTGRES_PASSWORD: tu_contraseña_segura
     POSTGRES_DB: gestion_ingenieria
   ```

2. **Backend**: Actualiza las variables de entorno en `docker-compose.yml`
   ```yaml
   environment:
     SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/gestion_ingenieria
     SPRING_DATASOURCE_USERNAME: tu_usuario
     SPRING_DATASOURCE_PASSWORD: tu_contraseña_segura
   ```

3. **JWT Secret**: Cambia el secreto JWT
   ```yaml
   environment:
     JWT_SECRET: tu_secreto_jwt_muy_largo_y_seguro
   ```

### HTTPS

Para producción, configura un reverse proxy (Nginx, Traefik) con certificados SSL/TLS.

---

## 🌐 Configuración de Red

### Puertos Expuestos

Por defecto, el `docker-compose.yml` expone:

| Servicio | Puerto Host | Puerto Contenedor |
|----------|-------------|-------------------|
| Frontend | 80 | 80 |
| Backend | 8082 | 8082 |
| PostgreSQL | 5432 | 5432 |

### Cambiar Puertos

Si necesitas cambiar los puertos, edita `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Frontend en puerto 8080
```

---

## 🚨 Troubleshooting

### Puerto ya en uso

**Error**: `Bind for 0.0.0.0:80 failed: port is already allocated`

**Solución**: Cambia el puerto en `docker-compose.yml` o detén el servicio que está usando el puerto.

### Backend no se conecta a la base de datos

**Solución**:
1. Verifica que el contenedor de la base de datos esté corriendo: `docker-compose ps`
2. Revisa los logs: `docker-compose logs db`
3. Verifica las credenciales en `docker-compose.yml`

### Frontend muestra error 502

**Solución**:
1. Verifica que el backend esté corriendo: `docker-compose logs backend`
2. Espera unos segundos, el backend puede tardar en iniciar
3. Verifica la configuración del proxy en el frontend

### Datos no persisten

**Solución**:
- Asegúrate de no usar `docker-compose down -v` a menos que quieras eliminar los datos
- Verifica que el volumen `db_data` esté definido en `docker-compose.yml`

### Reconstrucción completa

Si nada funciona, limpia todo y empieza de nuevo:

```bash
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Monitoreo

### Ver Uso de Recursos

```bash
docker stats
```

### Inspeccionar un Contenedor

```bash
docker inspect gestion-backend
docker inspect gestion-frontend
docker inspect gestion-db
```

---

## 🔄 Actualización de la Aplicación

1. **Obtener los últimos cambios**:
   ```bash
   git pull
   ```

2. **Reconstruir y reiniciar**:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

3. **Verificar que todo funciona**:
   ```bash
   docker-compose logs -f
   ```

---

## 📝 Notas Adicionales

- Los datos de la base de datos se almacenan en un volumen Docker (`db_data`)
- Los archivos subidos por los usuarios se almacenan en el contenedor del backend
- Para persistir los archivos subidos, considera agregar un volumen para la carpeta `uploads/`

### Persistir Archivos Subidos

Agrega esto a la sección `backend` en `docker-compose.yml`:

```yaml
volumes:
  - ./backend/uploads:/app/uploads
```

---

## 🎯 Próximos Pasos

- Configurar backups automáticos de la base de datos
- Implementar monitoreo con Prometheus/Grafana
- Configurar CI/CD para despliegues automáticos
- Implementar HTTPS con Let's Encrypt
