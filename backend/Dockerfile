# ETAPA 1: Compilar (Usamos una imagen de Maven que SÍ existe)
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copiamos archivos de configuración y descargamos librerías
COPY pom.xml .
RUN mvn dependency:go-offline

# Copiamos el código fuente y compilamos el .jar
COPY src ./src
RUN mvn clean package -DskipTests

# ETAPA 2: Ejecutar (Usamos una imagen ligera válida)
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# Copiamos el .jar que acabamos de fabricar arriba
COPY --from=build /app/target/*.jar app.jar

# Arrancamos la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]