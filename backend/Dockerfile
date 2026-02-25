# ETAPA 1: Compilar
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

# ETAPA 2: Ejecutar
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Railway inyecta la variable PORT automáticamente.
# Usamos CMD en forma shell (sh -c) para que ${PORT} se interpole en runtime.
# En local sin PORT, Spring Boot usará el default de application.properties (8082).
EXPOSE 8082

CMD ["sh", "-c", "java -jar app.jar --server.port=${PORT:-8082}"]
