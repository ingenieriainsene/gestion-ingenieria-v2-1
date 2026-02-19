# Guía de Despliegue en Entorno Empresarial (Windows Server)

Esta guía detalla los pasos necesarios para desplegar la aplicación **Gestión Ingeniería** (Backend Spring Boot + Frontend Angular) en un servidor Windows Server de producción.

## 1. Arquitectura de Despliegue

- **Backend**: Java Spring Boot (Ejecutable JAR).
- **Frontend**: Angular (Archivos estáticos HTML/JS/CSS).
- **Base de Datos**: PostgreSQL (Supabase).
- **Servidor Web**: IIS (Internet Information Services) o Nginx para Windows.
- **Process Manager**: NSSM (Non-Sucking Service Manager) para ejecutar Java como servicio de Windows.

## 2. Requisitos Previos del Servidor

En el servidor Windows destino, se debe instalar:

1.  **OpenJDK 17 (LTS)**: Necesario para ejecutar el backend.
    -   Descargar e instalar (ej. Eclipse Temurin o Amazon Corretto).
    -   Configurar la variable de entorno `JAVA_HOME` y añadir `%JAVA_HOME%\bin` al `PATH`.
2.  **IIS (Internet Information Services)**:
    -   Activar el rol de "Web Server (IIS)" desde el Server Manager.
    -   **Importante**: Instalar el módulo **URL Rewrite** para IIS (necesario para las rutas de Angular).
3.  **NSSM (Opcional pero recomendado)**:
    -   Pequeña utilidad para instalar la aplicación Java como un servicio de Windows que arranca automáticamente al reiniciar.

---

## 3. Preparación del Backend (Spring Boot)

### Configuración (application.properties)
En un entorno real, **NUNCA** se deben "quemar" credenciales en el código. Spring Boot permite sobrescribir la configuración usando variables de entorno o un archivo externo.

**Estrategia recomendada**:
Crear un archivo `application-prod.properties` en el servidor (ej. en `C:\apps\gestion\config\`) con los datos de producción:

```properties
spring.datasource.url=jdbc:postgresql://tu-supabase-db.com:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=TU_CONTRASEÑA_SEGURA
spring.jpa.hibernate.ddl-auto=validate
server.port=8080
# Cors
cors.allowed.origins=https://tu-dominio.com
```

### Construcción del Artefacto (JAR)
Desde tu entorno de desarrollo (o CI/CD), genera el paquete optimizado:

```bash
cd backend
mvn clean package -Pprod -DskipTests
```
Esto generará un archivo `.jar` en `backend/target/` (ej. `gestion-backend-0.0.1-SNAPSHOT.jar`).

### Instalación como Servicio Windows
1.  Copiar el `.jar` al servidor (ej. `C:\apps\gestion\backend.jar`).
2.  Usar NSSM para instalar el servicio:
    ```powershell
    nssm install GestionBackend "C:\Program Files\Java\jdk-17\bin\java.exe"
    ```
3.  En la ventana de NSSM:
    -   **Arguments**: `-jar C:\apps\gestion\backend.jar --spring.config.location=C:\apps\gestion\config\application-prod.properties`
    -   **Startup directory**: `C:\apps\gestion\`
4.  Iniciar el servicio desde `services.msc` o `nssm start GestionBackend`.

---

## 4. Preparación del Frontend (Angular)

### Configuración de Entorno
Editar `src/environments/environment.prod.ts` para que apunte a la URL real del backend o al dominio:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api', // O la IP del servidor puerto 8080 si no hay proxy reverso
  supabaseUrl: 'TU_URL_SUPABASE',
  supabaseKey: 'TU_KEY_SUPABASE'
};
```

### Construcción (Build)
Generar los archivos optimizados para producción:

```bash
cd frontend
ng build --configuration production
```
Esto creará la carpeta `dist/gestion-frontend/browser` con los archivos HTML/JS/CSS.

### Despliegue en IIS
1.  Crear un nuevo sitio en IIS (ej. "GestionIngenieria").
2.  Apuntar la ruta física a la carpeta donde copiaste los archivos del `dist` (ej. `C:\inetpub\wwwroot\gestion`).
3.  **Configuración de Rutas (SPA)**:
    -   Angular maneja el enrutamiento en el cliente. Si recargas la página en `/locales`, IIS buscará esa carpeta y dará error 404.
    -   Crear un archivo `web.config` en la raíz de la carpeta del frontend (`C:\inetpub\wwwroot\gestion`) con este contenido para redirigir todo al `index.html`:

```xml
<configuration>
<system.webServer>
  <rewrite>
    <rules>
      <rule name="Angular Routes" stopProcessing="true">
        <match url=".*" />
        <conditions logicalGrouping="MatchAll">
          <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
        </conditions>
        <action type="Rewrite" url="/" />
      </rule>
    </rules>
  </rewrite>
</system.webServer>
</configuration>
```

---

## 5. Proxy Inverso (Opcional pero recomendado)

Para tener todo bajo el mismo dominio y puerto (80/443), se suele configurar IIS (o Nginx) como proxy inverso para el backend.

1.  Instalar **Application Request Routing (ARR)** en IIS.
2.  Crear una regla de URL Rewrite que redirija las peticiones `/api/*` a `http://localhost:8080/api/*`.
3.  De esta forma, el frontend hace peticiones a `/api/...` (mismo dominio) y evita problemas de CORS complejos.

## Resumen del Flujo de Trabajo Futuro

1.  **Desarrollo**: Trabajas en local.
2.  **Commit**: Subes cambios a Git.
3.  **Build**:
    -   Generas el `.jar` del backend.
    -   Generas el `dist` del frontend.
4.  **Deploy**:
    -   Detienes el servicio backend, reemplazas el `.jar`, inicias el servicio.
    -   Reemplazas los archivos en `wwwroot` del frontend.

Esta estructura asegura un entorno robusto, seguro y mantenible en Windows Server.
