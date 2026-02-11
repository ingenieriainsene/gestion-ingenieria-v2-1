# GUÍA DE INSTALACIÓN COMPLETA (Laptop Limpio)

Esta guía explica paso a paso cómo dejar el proyecto funcionando en un portátil nuevo, priorizando Docker.

---

## 🏗️ Opción A: INSTALACIÓN CON DOCKER (Recomendada)
**Requisitos:** Solo necesitas instalar Docker y Git.

### 1. Descargar e Instalar Docker Desktop
1.  Ve a [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2.  Descarga e instala la versión para Windows.
3.  Reinicia el portátil si te lo pide.
4.  Abre Docker Desktop y espera a que el icono de la ballena deje de parpadear (estado "Running").

### 2. Clonar el Proyecto
1.  Instala Git desde [https://git-scm.com/downloads](https://git-scm.com/downloads).
2.  Abre una terminal (PowerShell o CMD) en la carpeta donde quieras trabajar:
    ```bash
    git clone https://github.com/TU_USUARIO/gestion-ingenieria-v2.git
    cd gestion-ingenieria-v2
    ```

### 3. Levantar la Aplicación
En la terminal, dentro de la carpeta del proyecto, ejecuta:

```bash
docker-compose up -d --build
```
*(Esto tardará unos minutos la primera vez mientras descarga las imágenes de PostgreSQL, Java y Node).*

### 4. Acceder
- **Frontend:** http://localhost (puerto 80)
- **Backend:** http://localhost:8082
- **Base de Datos PostgreSQL:** Puerto 5432 (usuario: postgres / clave: postgres)

---

## 🛠️ Opción B: INSTALACIÓN MANUAL (PostgreSQL + Java + Node)
Usa esta opción si Docker no funciona o prefieres tener control manual.

### 1. Instalar Base de Datos (PostgreSQL)
1.  Descarga PostgreSQL desde [https://www.postgresql.org/download/](https://www.postgresql.org/download/).
2.  Instala PostgreSQL 15 o superior.
3.  Durante la instalación, establece una contraseña para el usuario `postgres`.
4.  Abre pgAdmin (incluido con PostgreSQL) o usa la línea de comandos.
5.  Crea una base de datos llamada `gestion_ingenieria`.
6.  Importa el fichero `sql/ddl_ingenieria.sql`:
    ```bash
    psql -U postgres -d gestion_ingenieria -f sql/ddl_ingenieria.sql
    ```

### 2. Instalar Java (JDK 17)
1.  Descarga el JDK 17 desde [https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html) o usa OpenJDK.
2.  Instálalo y asegúrate de añadirlo al PATH del sistema.
    - Verifica con: `java -version` en la terminal.

### 3. Instalar Node.js (Frontend)
1.  Descarga Node.js (LTS) desde [https://nodejs.org/es](https://nodejs.org/es).
2.  Instálalo.
3.  Verifica con: `node -v` y `npm -v`.

### 4. Instalar Dependencias del Backend (Maven)
*(Si no tienes Maven instalado, puedes usar el wrapper si existe, o instalarlo)*
1.  Descarga Maven desde [https://maven.apache.org/download.cgi](https://maven.apache.org/download.cgi).
2.  Descomprime en `C:\Program Files\Apache\maven`.
3.  Añade `C:\Program Files\Apache\maven\bin` a tu variable de entorno PATH.
4.  Ejecuta `mvn -v` para verificar.

### 5. Configurar Variables de Entorno (Opcional)
Si tu PostgreSQL usa credenciales diferentes, crea un archivo `.env` en la raíz del proyecto:
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/gestion_ingenieria
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=tu_contraseña
```

### 6. Ejecutar el Proyecto

**Paso 6.1: Backend**
Abre una terminal en la carpeta `backend/`:
```bash
mvn spring-boot:run
```
*(Espera a que diga "Started GestionIngenieriaApplication in ... seconds")*

**Paso 6.2: Frontend**
Abre otra terminal en la carpeta `frontend/`:
```bash
npm install
npm start
```
*(Espera a que diga "Compiled successfully")*

### 7. Acceder
- **Frontend:** http://localhost:4200
- **Backend:** http://localhost:8082

---

## 🔐 Credenciales por Defecto

**Usuario Admin:**
- Usuario: `jefe_admin`
- Contraseña: `admin123`

**Base de Datos (Docker):**
- Host: `localhost`
- Puerto: `5432`
- Usuario: `postgres`
- Contraseña: `postgres`
- Base de datos: `gestion_ingenieria`

---

## 🚨 Solución de Problemas

### Docker no inicia
- Asegúrate de que la virtualización esté habilitada en la BIOS
- Reinicia Docker Desktop
- Verifica que no haya conflictos de puertos

### Backend no se conecta a la base de datos
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `application.properties`
- Asegúrate de que la base de datos `gestion_ingenieria` exista

### Puerto ocupado
- Cambia los puertos en `docker-compose.yml` o en la configuración manual
- Detén otros servicios que puedan estar usando los puertos 80, 8082 o 5432
