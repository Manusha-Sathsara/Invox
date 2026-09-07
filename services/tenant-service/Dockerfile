# Stage 1: Build the application
FROM eclipse-temurin:25-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and POM configuration
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Normalize line endings and ensure execution permission
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Download dependencies for layer caching
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and package application
COPY src/ ./src/
RUN ./mvnw clean package -DskipTests && \
    find target -maxdepth 1 -name "*.jar" ! -name "*.original" -exec cp {} app.jar \;

# Stage 2: Lightweight, secure runtime
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Run as an unprivileged user for defense-in-depth zero-trust security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

# Copy executable jar from builder stage
COPY --from=builder --chown=appuser:appgroup /app/app.jar app.jar

EXPOSE 8081

# Container-friendly JVM options
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
