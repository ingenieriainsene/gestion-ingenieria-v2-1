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
*(Esto tardará unos minutos la primera vez mientras descarga las imágenes de base de datos, Java y Node).*

### 4. Acceder
- **Frontend:** http://localhost:80 (o simplemente http://localhost)
- **Backend:** http://localhost:8082
- **Base de Datos:** Puerto 3307 (usuario: root / clave: root)

---

## 🛠️ Opción B: INSTALACIÓN MANUAL (XAMPP + Java + Node)
Usa esta opción si Docker no funciona o prefieres tener control manual.

### 1. Instalar Base de Datos (XAMPP)
1.  Descarga XAMPP desde [https://www.apachefriends.org/es/index.html](https://www.apachefriends.org/es/index.html).
2.  Instala solo **MySQL** y **Apache** (opcional).
3.  Abre el Panel de Control de XAMPP e inicia "MySQL".
4.  Ve a `http://localhost/phpmyadmin` (si instalaste Apache) o usa un cliente SQL (HeidiSQL, DBeaver).
5.  Crea una base de datos llamada `gestion_ingenieria`.
6.  Importa el fichero `sql/ddl_ingenieria_xampp.sql`.

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

### 5. Ejecutar el Proyecto

**Paso 5.1: Backend**
Abre una terminal en la carpeta `backend/`:
```bash
mvn spring-boot:run
```
*(Espera a que diga "Started GestionIngenieriaApplication in ... seconds")*

**Paso 5.2: Frontend**
Abre otra terminal en la carpeta `frontend/`:
```bash
npm install
npm start
```
*(Espera a que diga "Compiled successfully")*

### 6. Acceder
- **Frontend:** http://localhost:4200
- **Backend:** http://localhost:8082
