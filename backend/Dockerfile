# --- ETAPA 1: Compilación (Maven) ---
# Usamos una imagen que SÍ existe y funciona
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copiamos archivos y descargamos librerías
COPY pom.xml .
RUN mvn dependency:go-offline

# Copiamos el código y compilamos
COPY src ./src
RUN mvn clean package -DskipTests

# --- ETAPA 2: Ejecución (Java) ---
# Usamos una imagen ligera y válida para correr la app
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copiamos el .jar que fabricamos en la etapa 1
COPY --from=build /app/target/*.jar app.jar

# Arrancamos
ENTRYPOINT ["java", "-jar", "app.jar"]