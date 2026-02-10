# Gestión Ingeniería v2

Sistema de gestión para proyectos de ingeniería con backend Spring Boot y frontend Angular.

## 🚀 Inicio Rápido

### Opción 1: XAMPP (MySQL) - **CONFIGURACIÓN ACTUAL**

1. **Iniciar MySQL en XAMPP**
   - Abre el Panel de Control de XAMPP
   - Inicia el servicio MySQL

2. **Crear la base de datos**
   - Abre http://localhost/phpmyadmin
   - Ejecuta el script: `sql/ddl_ingenieria_xampp.sql`

3. **Levantar el backend**
   ```bash
   run-backend-xampp.bat
   ```

4. **Levantar el frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

5. **Acceder a la aplicación**
   - Frontend: http://localhost:4200
   - Backend: http://localhost:8082
   - Usuario: `jefe_admin` / Contraseña: `admin123`

---

### Opción 2: Docker (PostgreSQL)

1. **Cambiar configuración**
   - Abre `backend/src/main/resources/application.properties`
   - Comenta las líneas de XAMPP (MySQL)
   - Descomenta las líneas de DOCKER (PostgreSQL)

2. **Iniciar Docker**
   ```bash
   docker-compose up -d
   ```

3. **Levantar el backend**
   ```bash
   run-backend-docker.bat
   ```

4. **Levantar el frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

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
│   └── pom.xml                # Dependencias Maven
├── frontend/                  # Angular 17
│   ├── src/
│   │   └── app/              # Componentes Angular
│   └── package.json          # Dependencias npm
├── sql/
│   ├── ddl_ingenieria.sql           # Schema PostgreSQL (Docker)
│   └── ddl_ingenieria_xampp.sql     # Schema MySQL (XAMPP)
├── run-backend-xampp.bat     # Script para XAMPP
└── run-backend-docker.bat    # Script para Docker
```

---

## 🔧 Requisitos

- **Java JDK 17** o superior
- **Maven 3.6+**
- **Node.js 18+** y npm
- **XAMPP** (para MySQL) O **Docker** (para PostgreSQL)

---

## 📝 Notas

- El archivo `application.properties` contiene ambas configuraciones
- Por defecto está configurado para **XAMPP (MySQL)**
- Para cambiar a Docker, solo comenta/descomenta las líneas correspondientes
- Los datos de prueba se crean automáticamente al iniciar el backend

---

## 🆘 Problemas Comunes

### Backend no inicia
- Verifica que MySQL/PostgreSQL esté corriendo
- Verifica las credenciales en `application.properties`
- Verifica que la base de datos exista

### Frontend no se conecta
- Verifica que el backend esté corriendo en http://localhost:8082
- Revisa la consola del navegador (F12) para errores

### Puerto ocupado
- Backend: Cambia `server.port` en `application.properties`
- Frontend: Ejecuta `ng serve --port 4201`
