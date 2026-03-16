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

# Railway usará la variable BACKEND_PORT que tienes en el dashboard (8082)
EXPOSE 8082

CMD ["sh", "-c", "java -jar app.jar --server.port=${BACKEND_PORT:-8082}"]
