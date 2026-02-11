# ETAPA 1: Compilación
# Usamos una imagen oficial de Maven con Java 17 para construir el proyecto
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# 1. Copiamos el archivo pom.xml primero
# Esto permite que Docker cachee las dependencias si el archivo no cambia
COPY pom.xml .

# 2. Descargamos las dependencias
# Añadimos reintentos (retryHandler) para que no falle si la conexión del móvil es inestable
# El flag || true evita que el proceso se detenga si Maven reporta errores menores de red
RUN mvn dependency:go-offline -B -Dmaven.wagon.http.retryHandler.count=5 || true

# 3. Copiamos el resto del código fuente
COPY src ./src

# 4. Compilamos el archivo .jar saltando los tests para ahorrar tiempo
RUN mvn clean package -DskipTests

# ETAPA 2: Ejecución
# Usamos una imagen de Java ligera (JRE) para que el contenedor ocupe menos espacio
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copiamos el .jar generado en la etapa de compilación
# Usamos el comodín *.jar para asegurar que lo encuentre sin importar el nombre exacto
# Prueba con esta ruta que es la estándar si la anterior falló
COPY --from=build /app/target/*.jar app.jar
# Exponemos el puerto que configuramos en el properties
EXPOSE 8082

# Comando para arrancar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]