# Architecture Decisions & Engineering Hurdles Log (ADR)

## ADR-001: Strict OIDC Redirect URI Matching
- **Context:** Asgardeo enforces strict exact character matching on redirect URIs.
- **Decision:** Consistently configure `http://localhost:5173` without trailing slashes across Asgardeo Console and React SDK `afterSignInUrl`/`afterSignOutUrl`.

## ADR-002: Spring Cloud Gateway vs. Spring MVC Servlet Model
- **Context:** Classpath collision between Spring Cloud Gateway (WebFlux) and Spring Web MVC caused runtime initialization errors.
- **Decision:** Standardize backend microservices on Spring Boot Web MVC (`spring-boot-starter-web`) with Tomcat runtime and standard `SecurityFilterChain`.

## ADR-003: Backend JWT Assertion via WSO2 APIM vs. Direct JWKS Validation
- **Context:** Java 23/Spring Boot direct outbound calls to Asgardeo JWKS hit Cloudflare rate-limiting/anti-bot protection headers.
- **Decision:** Shift all public token verification and scope validation to WSO2 API Manager. Microservices operate inside private network and validate lightweight internal `X-JWT-Assertion` tokens.

## ADR-004: Hibernate 6 Native Multi-Tenancy Discriminator
- **Context:** Schema-per-tenant vs. Column discriminator.
- **Decision:** Use Hibernate 6 native `@TenantId` with shared schema and column discriminator (`tenant_id`), maximizing resource efficiency and avoiding migration overhead.
