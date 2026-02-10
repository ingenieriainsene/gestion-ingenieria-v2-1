# --- ETAPA 1: Compilación ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copiamos archivos y descargamos librerías
COPY pom.xml .
RUN mvn dependency:go-offline

# Copiamos el código y compilamos
COPY src ./src
RUN mvn clean package -DskipTests

# --- ETAPA 2: Ejecución ---
# Cambiamos a Eclipse Temurin que es más estable y seguro
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copiamos el .jar
COPY --from=build /app/target/*.jar app.jar

# Arrancamos
ENTRYPOINT ["java", "-jar", "app.jar"]