# MIGRACIÓN A UN ENTORNO ESTÁNDAR (Docker, Java, Angular)

Para garantizar que el proyecto funcione idénticamente en tu casa y en la oficina, hemos estandarizado la configuración. 

Sigue estos pasos **una sola vez** en cada ordenador:

## 1. Configurar Variables de Entorno (.env)
El archivo `.env` controla toda la configuración (puertos, usuarios, contraseñas).

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   # En Windows: copy .env.example .env
   ```
2. Edita `.env` con los valores de ese ordenador específico.
   * **Oficina:** Probablemente `DB_PORT_HOST=5432`.
   * **Casa:** Probablemente `DB_PORT_HOST=54322` (Si usas Supabase local default).

## 2. Iniciar la Base de Datos
Siempre iniciamos la base de datos con Docker para evitar problemas de instalación local.

```bash
docker-compose --profile dev up -d
```
*Esto arranca solo la base de datos en el puerto que definiste en `.env`.*

## 3. Ejecutar el Proyecto

### Opción A: Desarrollo Manual (Tu preferida)
Como ya tienes la BD corriendo en Docker, solo tienes que lanzar los servicios.

**Terminal 1 (Backend):**
El backend ahora leerá automáticamente la configuración.
```bash
cd backend
mvn spring-boot:run
```

**Terminal 2 (Frontend):**
El frontend ahora usa un proxy (`/api`) para conectarse al backend, así que no importa el puerto.
```bash
cd frontend
npm start
```

### Opción B: Todo en Docker (Para probar limpio)
Si quieres probar todo integrado como si fuera producción:
```bash
docker-compose --profile full up -d
```
*La app estará en http://localhost:80*

---

## Solución de Problemas Comunes

**Error: Connection refused (Backend)**
Revisa `DB_PORT_HOST` en tu archivo `.env`. Debe coincidir con el puerto que expone tu Supabase/Postgres.

**Error: Cors / Network Error (Frontend)**
Ahora el frontend usa `/api`. Si da error, asegúrate de que el backend está corriendo en el puerto `8082` (o el que definiste en `.env`).
