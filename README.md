# Gestión Ingeniería v2

Sistema de gestión para proyectos de ingeniería con backend Spring Boot y frontend Angular.

## 🚀 Inicio Rápido con Docker

### Requisitos
- Docker y Docker Compose instalados
- Java JDK 17+ (para desarrollo local)
- Node.js 18+ y npm (para desarrollo local del frontend)

### Pasos

1. **Iniciar los servicios con Docker**
   ```bash
   docker-compose up -d
   ```

2. **Verificar que los servicios estén corriendo**
   ```bash
   docker-compose ps
   ```

3. **Acceder a la aplicación**
   - Frontend: http://localhost
   - Backend API: http://localhost:8082
   - Base de datos PostgreSQL: localhost:5432
   - Usuario: `jefe_admin` / Contraseña: `admin123`

### Detener los servicios
```bash
docker-compose down
```

### Reconstruir los contenedores
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 🛠️ Desarrollo Local (sin Docker)

Si prefieres ejecutar el backend y frontend localmente:

### Backend

1. **Asegúrate de tener PostgreSQL corriendo** (puede ser con Docker):
   ```bash
   docker run -d -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gestion_ingenieria postgres:15-alpine
   ```

2. **Ejecuta el script SQL de inicialización**:
   ```bash
   psql -h localhost -U postgres -d gestion_ingenieria -f sql/ddl_ingenieria.sql
   ```

3. **Levantar el backend**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

### Frontend

1. **Instalar dependencias**:
   ```bash
   cd frontend
   npm install
   ```

2. **Levantar el servidor de desarrollo**:
   ```bash
   npm start
   ```

3. **Acceder a la aplicación**:
   - Frontend: http://localhost:4200
   - Backend: http://localhost:8082

---

## 📁 Estructura del Proyecto

```
gestion-ingenieria-v2/
├── backend/                    # Spring Boot (Java 17)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/          # Código fuente
│   │   │   └── resources/     # application.properties
│   │   └── test/
│   ├── pom.xml                # Dependencias Maven
│   └── Dockerfile             # Imagen Docker del backend
├── frontend/                  # Angular 17
│   ├── src/
│   │   └── app/              # Componentes Angular
│   ├── package.json          # Dependencias npm
│   └── Dockerfile            # Imagen Docker del frontend
├── sql/
│   ├── ddl_ingenieria.sql    # Schema PostgreSQL
│   └── fix_chat_schema.sql   # Correcciones del schema
├── docker-compose.yml         # Orquestación de servicios
└── run-backend-docker.bat     # Script para desarrollo local
```

---

## 🔧 Configuración

### Variables de Entorno

El archivo `.env.example` contiene todas las variables de entorno disponibles. Para desarrollo local, puedes crear un archivo `.env` basado en este ejemplo.

### Base de Datos

- **Motor**: PostgreSQL 15
- **Puerto**: 5432
- **Base de datos**: gestion_ingenieria
- **Usuario**: postgres
- **Contraseña**: postgres

### Puertos

| Servicio | Puerto |
|----------|--------|
| Frontend | 80 (Docker) / 4200 (desarrollo) |
| Backend | 8082 |
| PostgreSQL | 5432 |

---

## 🆘 Problemas Comunes

### Backend no inicia
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `application.properties` o variables de entorno
- Verifica que la base de datos `gestion_ingenieria` exista

### Frontend no se conecta
- Verifica que el backend esté corriendo en http://localhost:8082
- Revisa la consola del navegador (F12) para errores CORS

### Puerto ocupado
- Backend: Cambia `SERVER_PORT` en las variables de entorno
- Frontend (desarrollo): Ejecuta `ng serve --port 4201`
- Docker: Modifica los puertos en `docker-compose.yml`

### Problemas con Docker
```bash
# Limpiar todo y empezar de nuevo
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

---

## 📝 Notas

- El proyecto está configurado para usar PostgreSQL con Docker
- Los datos de prueba se crean automáticamente al iniciar el backend
- Para producción, asegúrate de cambiar las credenciales por defecto

---

## 🔐 Usuarios de Prueba

El sistema crea automáticamente usuarios de prueba:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `jefe_admin` | `admin123` | ADMIN |
| `carlos_tec` | `tecnico123` | TÉCNICO |
| `marta_tec` | `tecnico123` | TÉCNICO |
| `raul_tec` | `tecnico123` | TÉCNICO |
| `elena_tec` | `tecnico123` | TÉCNICO |
| `pablo_tec` | `tecnico123` | TÉCNICO |
