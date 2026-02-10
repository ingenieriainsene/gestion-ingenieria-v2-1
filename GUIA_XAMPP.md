# 🚀 Guía Completa: Levantar la Aplicación con XAMPP

Esta guía te llevará paso a paso para configurar y ejecutar el proyecto **Gestión Ingeniería v2** usando el entorno XAMPP.

---

## 📋 **Requisitos Previos**

Antes de comenzar, asegúrate de tener instalado:

1. **XAMPP** (con MySQL/MariaDB)
   - Descarga: https://www.apachefriends.org/
   
2. **Java JDK 17** o superior
   - Descarga: https://www.oracle.com/java/technologies/downloads/
   - Verifica con: `java -version`
   
3. **Maven** (para el backend Spring Boot)
   - Descarga: https://maven.apache.org/download.cgi
   - Verifica con: `mvn -version`
   
4. **Node.js** (v18 o superior) y **npm**
   - Descarga: https://nodejs.org/
   - Verifica con: `node -version` y `npm -version`

---

## 🗄️ **PASO 1: Configurar la Base de Datos MySQL en XAMPP**

### 1.1 Iniciar XAMPP
1. Abre el **Panel de Control de XAMPP**
2. Inicia el servicio **MySQL** (haz clic en "Start")
3. Verifica que el estado sea "Running" (verde)

### 1.2 Crear la Base de Datos
1. Abre tu navegador y ve a: **http://localhost/phpmyadmin**
2. Haz clic en la pestaña **"SQL"**
3. Abre el archivo `sql/ddl_ingenieria_xampp.sql` desde tu proyecto
4. Copia **TODO** el contenido del archivo
5. Pégalo en el editor SQL de phpMyAdmin
6. Haz clic en **"Continuar"** o **"Go"**

**✅ Resultado esperado:** 
- Se creará la base de datos `gestion_ingenieria`
- Se crearán todas las tablas (usuarios, clientes, locales, contratos, etc.)
- Se insertarán datos de prueba

### 1.3 Verificar la Creación
1. En phpMyAdmin, selecciona la base de datos `gestion_ingenieria` en el panel izquierdo
2. Deberías ver todas las tablas creadas
3. Haz clic en la tabla `usuarios` y verifica que hay 6 usuarios de prueba

---

## ⚙️ **PASO 2: Configurar el Backend (Spring Boot)**

### 2.1 Configurar las Credenciales de la Base de Datos

El backend usa **variables de entorno** para conectarse a la base de datos. Tienes dos opciones:

#### **Opción A: Usar el archivo .bat (Recomendado para XAMPP)**

1. Abre el archivo `run-backend-xampp.bat` en un editor de texto
2. **IMPORTANTE:** Modifica las siguientes líneas con tus credenciales de MySQL:

```batch
set "APP_PROFILE=xampp"
set "DB_URL=jdbc:mysql://localhost:3306/gestion_ingenieria?useSSL=false&serverTimezone=Europe/Madrid"
set "DB_USER=root"
set "DB_PASSWORD="
```

**Notas:**
- `DB_URL`: Cambia `localhost:3306` si tu MySQL usa otro puerto
- `DB_USER`: Por defecto en XAMPP es `root`
- `DB_PASSWORD`: Por defecto en XAMPP está vacío (deja las comillas vacías `""`)

3. Guarda el archivo

#### **Opción B: Configurar Variables de Entorno del Sistema**

Si prefieres no usar el .bat, puedes configurar las variables de entorno en Windows:

1. Busca "Variables de entorno" en el menú de Windows
2. Agrega estas variables de usuario:
   - `APP_PROFILE` = `xampp`
   - `DB_URL` = `jdbc:mysql://localhost:3306/gestion_ingenieria?useSSL=false&serverTimezone=Europe/Madrid`
   - `DB_USER` = `root`
   - `DB_PASSWORD` = (vacío o tu contraseña de MySQL)

### 2.2 Verificar la Configuración del Backend

1. Abre el archivo `backend/src/main/resources/application.properties`
2. Verifica que contenga:
   ```properties
   spring.profiles.active=${APP_PROFILE:shared}
   server.port=8082
   ```

3. Abre el archivo `backend/src/main/resources/application-xampp.properties`
4. Verifica que contenga:
   ```properties
   spring.datasource.url=${DB_URL}
   spring.datasource.username=${DB_USER}
   spring.datasource.password=${DB_PASSWORD}
   spring.datasource.driver-class-name=org.postgresql.Driver
   spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
   ```

**⚠️ IMPORTANTE:** Hay un error en el archivo `application-xampp.properties`. Está configurado para PostgreSQL pero debería usar MySQL. Vamos a corregirlo en el siguiente paso.

---

## 🔧 **PASO 3: Corregir la Configuración de MySQL**

El archivo `application-xampp.properties` tiene configuración de PostgreSQL, pero necesitamos MySQL para XAMPP.

**Necesitarás actualizar este archivo** (te ayudaré con esto en el siguiente paso).

---

## 🚀 **PASO 4: Levantar el Backend**

### 4.1 Abrir Terminal en la Carpeta del Backend

1. Abre una terminal (PowerShell o CMD)
2. Navega a la carpeta del backend:
   ```bash
   cd c:\Users\Usuario\Desktop\gestion-ingenieria-v2\backend
   ```

### 4.2 Compilar y Ejecutar

**Opción A: Usando el archivo .bat (Recomendado)**

1. Desde la raíz del proyecto, ejecuta:
   ```bash
   cd c:\Users\Usuario\Desktop\gestion-ingenieria-v2
   .\run-backend-xampp.bat
   ```

**Opción B: Usando Maven directamente**

1. Desde la carpeta `backend`, ejecuta:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=xampp"
   ```

### 4.3 Verificar que el Backend Está Funcionando

**✅ Señales de éxito:**
- Verás logs en la consola
- Al final verás algo como: `Started GestionBackendApplication in X.XXX seconds`
- El servidor estará corriendo en: **http://localhost:8082**

**🧪 Prueba rápida:**
1. Abre tu navegador
2. Ve a: **http://localhost:8082/api/auth/health** (si existe este endpoint)
3. O intenta hacer login con las credenciales de prueba

---

## 🎨 **PASO 5: Configurar el Frontend (Angular)**

### 5.1 Instalar Dependencias

1. Abre una **NUEVA terminal** (deja la del backend abierta)
2. Navega a la carpeta del frontend:
   ```bash
   cd c:\Users\Usuario\Desktop\gestion-ingenieria-v2\frontend
   ```

3. Instala las dependencias de Node.js:
   ```bash
   npm install
   ```

**⏱️ Esto puede tardar unos minutos la primera vez.**

### 5.2 Verificar la Configuración del Frontend

El frontend debe estar configurado para conectarse al backend en `http://localhost:8082`.

1. Busca archivos de configuración en `frontend/src/environments/`
2. Verifica que la URL del API apunte a `http://localhost:8082`

---

## 🌐 **PASO 6: Levantar el Frontend**

### 6.1 Ejecutar el Servidor de Desarrollo

Desde la carpeta `frontend`, ejecuta:

```bash
npm start
```

O alternativamente:

```bash
ng serve
```

### 6.2 Verificar que el Frontend Está Funcionando

**✅ Señales de éxito:**
- Verás: `** Angular Live Development Server is listening on localhost:4200 **`
- Verás: `✔ Compiled successfully.`

### 6.3 Abrir la Aplicación

1. Abre tu navegador
2. Ve a: **http://localhost:4200**
3. Deberías ver la pantalla de login

---

## 🔐 **PASO 7: Iniciar Sesión**

Usa las credenciales de prueba creadas en la base de datos:

### Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `jefe_admin` | `admin123` | ADMIN |
| `carlos_tec` | `tecnico123` | TÉCNICO |
| `marta_tec` | `tecnico123` | TÉCNICO |
| `raul_tec` | `tecnico123` | TÉCNICO |
| `elena_tec` | `tecnico123` | TÉCNICO |
| `pablo_tec` | `tecnico123` | TÉCNICO |

**Nota:** Las contraseñas están hasheadas con BCrypt en la base de datos. Si las contraseñas anteriores no funcionan, verifica el código fuente para ver las contraseñas reales.

---

## 📝 **Resumen de Puertos y URLs**

| Servicio | Puerto | URL |
|----------|--------|-----|
| MySQL (XAMPP) | 3306 | localhost:3306 |
| phpMyAdmin | 80 | http://localhost/phpmyadmin |
| Backend (Spring Boot) | 8082 | http://localhost:8082 |
| Frontend (Angular) | 4200 | http://localhost:4200 |

---

## ❌ **Solución de Problemas Comunes**

### Problema 1: "Cannot connect to database"
**Solución:**
1. Verifica que MySQL esté corriendo en XAMPP
2. Verifica las credenciales en `run-backend-xampp-supabase.bat`
3. Verifica que la base de datos `gestion_ingenieria` exista en phpMyAdmin

### Problema 2: "Port 8082 already in use"
**Solución:**
1. Cambia el puerto en `backend/src/main/resources/application.properties`
2. Actualiza también la configuración del frontend

### Problema 3: "Port 4200 already in use"
**Solución:**
```bash
ng serve --port 4201
```

### Problema 4: "Maven command not found"
**Solución:**
1. Verifica que Maven esté instalado: `mvn -version`
2. Agrega Maven al PATH de Windows

### Problema 5: "Java version mismatch"
**Solución:**
1. Verifica tu versión de Java: `java -version`
2. Debe ser Java 17 o superior
3. Actualiza la variable `JAVA_HOME` si es necesario

### Problema 6: Frontend no se conecta al Backend
**Solución:**
1. Verifica que el backend esté corriendo (http://localhost:8082)
2. Revisa la consola del navegador (F12) para ver errores CORS
3. Verifica la configuración de CORS en el backend

---

## 🎯 **Próximos Pasos**

Una vez que todo esté funcionando:

1. **Explora la aplicación** con el usuario `jefe_admin`
2. **Revisa los datos de prueba** en phpMyAdmin
3. **Prueba las funcionalidades** de gestión de clientes, contratos, etc.
4. **Personaliza** según tus necesidades

---

## 📚 **Estructura del Proyecto**

```
gestion-ingenieria-v2/
├── backend/                    # Spring Boot (Java 17)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/          # Código fuente
│   │   │   └── resources/     # Configuración
│   │   └── test/
│   ├── pom.xml                # Dependencias Maven
│   └── uploads/               # Archivos subidos
├── frontend/                  # Angular 17
│   ├── src/
│   │   ├── app/              # Componentes Angular
│   │   └── environments/     # Configuración
│   └── package.json          # Dependencias npm
├── sql/
│   ├── ddl_ingenieria.sql           # Schema PostgreSQL (Docker)
│   └── ddl_ingenieria_xampp.sql     # Schema MySQL (XAMPP)
└── run-backend-xampp-supabase.bat   # Script de inicio
```

---

## 💡 **Consejos Adicionales**

1. **Mantén ambas terminales abiertas** (backend y frontend) mientras trabajas
2. **Usa Ctrl+C** para detener los servidores cuando termines
3. **Guarda cambios frecuentemente** en tu código
4. **Revisa los logs** en las terminales si algo no funciona

---

## 🆘 **¿Necesitas Ayuda?**

Si encuentras algún problema:
1. Revisa los logs en las terminales
2. Verifica que todos los servicios estén corriendo
3. Consulta la sección de "Solución de Problemas" arriba
4. Revisa la documentación de Spring Boot y Angular

---

**¡Listo! Ahora tienes una guía completa para levantar tu aplicación con XAMPP. 🎉**
