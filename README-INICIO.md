# 🚀 Gestión Ingeniería v2 - Guía de Inicio Rápido

## 📋 Requisitos Previos

Antes de ejecutar la aplicación, asegúrate de tener instalado:

1. **Java 17 o superior**
   - Descarga: https://www.oracle.com/java/technologies/downloads/
   - Verifica la instalación: `java -version`

2. **Maven**
   - Descarga: https://maven.apache.org/download.cgi
   - Verifica la instalación: `mvn -version`

3. **Node.js** (v16 o superior)
   - Descarga: https://nodejs.org/
   - Verifica la instalación: `node -v`

## 🎯 Inicio Rápido (Modo Fácil)

### Paso 1: Configurar Supabase

La **primera vez** que ejecutes la aplicación:

1. Haz doble clic en `INICIAR-APLICACION.bat`
2. El script detectará que no hay configuración y creará automáticamente el archivo `config-supabase.bat`
3. Se abrirá el archivo en el Bloc de notas

### Paso 2: Editar la Configuración

Edita el archivo `config-supabase.bat` con tus credenciales de Supabase:

#### Opción A: Supabase Cloud (Recomendado para producción)

```batch
set "DB_URL=jdbc:postgresql://db.XXXXX.supabase.co:5432/postgres?sslmode=require"
set "DB_USER=postgres"
set "DB_PASSWORD=tu_password_real"
```

**¿Dónde encontrar estos datos?**
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Settings** > **Database**
4. Copia la **Connection String (URI)** y conviértela al formato JDBC mostrado arriba

#### Opción B: Supabase Local (Para desarrollo)

```batch
set "DB_URL=jdbc:postgresql://127.0.0.1:54322/postgres"
set "DB_USER=postgres"
set "DB_PASSWORD=postgres"
```

### Paso 3: Ejecutar la Aplicación

1. Guarda el archivo `config-supabase.bat`
2. Vuelve a hacer doble clic en `INICIAR-APLICACION.bat`
3. El script automáticamente:
   - ✅ Verificará los requisitos del sistema
   - ✅ Instalará las dependencias necesarias (solo la primera vez)
   - ✅ Compilará el backend (solo la primera vez)
   - ✅ Iniciará el backend en `http://localhost:8082`
   - ✅ Iniciará el frontend en `http://localhost:4200`
   - ✅ Abrirá tu navegador automáticamente

## 🛑 Detener la Aplicación

Para detener la aplicación, simplemente cierra las ventanas del **Backend** y **Frontend** que se abrieron.

## 📂 Estructura del Proyecto

```
gestion-ingenieria-v2/
├── INICIAR-APLICACION.bat    ← ¡EJECUTA ESTE ARCHIVO!
├── config-supabase.bat        ← Configuración de Supabase (se crea automáticamente)
├── backend/                   ← Spring Boot (Java)
│   └── src/
├── frontend/                  ← Angular
│   └── src/
└── README-INICIO.md          ← Este archivo
```

## 🔧 Resolución de Problemas

### Error: "Java no está instalado"
- Instala Java 17 o superior
- Asegúrate de que Java esté en el PATH del sistema

### Error: "Maven no está instalado"
- Instala Maven
- Asegúrate de que Maven esté en el PATH del sistema

### Error: "Node.js no está instalado"
- Instala Node.js (v16 o superior)
- Asegúrate de que Node.js esté en el PATH del sistema

### Error: "Error al conectar con la base de datos"
- Verifica que las credenciales en `config-supabase.bat` sean correctas
- Si usas Supabase Cloud, asegúrate de que tu IP esté permitida en el firewall del proyecto
- Si usas Supabase Local, asegúrate de que Supabase esté corriendo (`supabase start`)

### El frontend no carga
- Espera unos segundos más (la primera compilación puede tardar 1-2 minutos)
- Verifica que el puerto 4200 no esté siendo usado por otra aplicación

### El backend no inicia
- Verifica que el puerto 8082 no esté siendo usado por otra aplicación
- Revisa la ventana del backend para ver posibles errores

## 📱 URLs de la Aplicación

Una vez iniciada, puedes acceder a:

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8082/api
- **Backend Health**: http://localhost:8082/actuator/health (si está habilitado)

## 💡 Consejos

- **Primera ejecución**: Puede tardar 3-5 minutos debido a la descarga de dependencias
- **Ejecuciones posteriores**: Tomarán solo 30-40 segundos
- **Desarrollo**: Mantén las ventanas del backend y frontend abiertas para ver logs en tiempo real
- **Producción**: Considera usar un servidor dedicado o servicio cloud

## 📞 Soporte

Si encuentras algún problema:
1. Revisa la sección de **Resolución de Problemas** más arriba
2. Verifica que todos los requisitos previos estén instalados correctamente
3. Revisa los logs en las ventanas del backend y frontend

---

**¡Listo!** Ahora puedes ejecutar tu aplicación con un solo clic. 🎉
