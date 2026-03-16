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

# Railway usará la variable PORT automáticamente (suele ser 8080).
EXPOSE 8080

CMD ["sh", "-c", "java -jar app.jar --server.port=${PORT:-8080}"]
