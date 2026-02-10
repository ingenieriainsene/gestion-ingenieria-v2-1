# Guía de Uso: XAMPP vs Docker

## 🖥️ Desarrollo Local con XAMPP

### Requisitos
- XAMPP con MySQL corriendo en puerto 3306
- Java 17+
- Node.js 18+

### Pasos
1. **Iniciar MySQL en XAMPP**
   ```bash
   # Abrir Panel de Control XAMPP → Start MySQL
   ```

2. **Crear base de datos**
   - Abrir http://localhost/phpmyadmin
   - Ejecutar `sql/ddl_ingenieria_xampp.sql`

3. **Iniciar backend**
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   El backend usará automáticamente:
   - MySQL en `localhost:3306`
   - Usuario: `root`
   - Password: (vacío)

4. **Iniciar frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Acceder a http://localhost:4200

---

## 🐳 Producción con Docker

### Requisitos
- Docker
- Docker Compose

### Pasos
1. **Detener y limpiar contenedores anteriores**
   ```bash
   docker-compose down -v
   ```

2. **Construir y levantar**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **Verificar que todo esté corriendo**
   ```bash
   docker-compose ps
   ```

4. **Acceder a la aplicación**
   - Frontend: http://localhost
   - Backend API: http://localhost:8082/api
   - Base de datos: localhost:3307 (desde el host)

---

## 🔧 Configuración Flexible

El proyecto está configurado para funcionar en ambos entornos sin cambios:

### Backend (`application.properties`)
Usa variables de entorno con valores por defecto para XAMPP:
```properties
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:mysql://localhost:3306/...}
```

- **XAMPP**: Usa los valores por defecto (después de `:`)
- **Docker**: Sobrescribe con las variables del `docker-compose.yml`

### Frontend
- **Desarrollo**: `environments.ts` → `http://localhost:8082/api`
- **Producción**: `environment.prod.ts` → `http://localhost:8082/api`

### CORS
La configuración `CorsConfig.java` permite ambos entornos:
- `http://localhost` (Docker)
- `http://localhost:4200` (XAMPP desarrollo)

---

## 📝 Credenciales por Defecto

**Usuario Admin:**
- Usuario: `jefe_admin`
- Contraseña: `admin123`

**Base de Datos (Docker):**
- Host: `localhost:3307` (desde host) o `db:3306` (desde contenedor)
- Usuario: `root`
- Password: `root`
- Base de datos: `gestion_ingenieria`

---

## 🚨 Troubleshooting

### XAMPP: "Cannot connect to database"
- Verificar que MySQL esté corriendo en XAMPP
- Verificar que la BD `gestion_ingenieria` exista

### Docker: "Port already in use"
- Detener XAMPP si está corriendo
- O cambiar puertos en `docker-compose.yml`

### CORS errors
- Verificar que no haya anotaciones `@CrossOrigin` en controllers
- Solo debe existir `CorsConfig.java`
