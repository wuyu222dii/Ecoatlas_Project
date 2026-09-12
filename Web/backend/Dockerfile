# Build stage (no local mvnw/.mvn required)
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -q -B dependency:go-offline -DskipTests

COPY src src
RUN mvn -q -B -DskipTests package \
    && cp target/demo-*.jar /app/app.jar

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /app/app.jar ./app.jar

# Render injects PORT; Spring Boot reads server.port=${PORT:8080}
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
