# Invox Architectural Specification & System Overview

## 1. Executive Summary
Invox is an enterprise-grade multi-tenant B2B Invoicing SaaS platform engineered with zero-trust security, automated identity lifecycle management, and transparent multi-tenant data isolation.

## 2. High-Level Architecture Topology
- **Presentation Tier:** React Single Page Application (Vite + Tailwind CSS + TypeScript) with `@asgardeo/react` SDK running OpenID Connect (OIDC) Proof Key for Code Exchange (PKCE) flow.
- **Identity & Access Management (IAM) Tier:** Asgardeo by WSO2 managing multi-organization structures, user registries, custom claims, and SCIM 2.0 provisioning APIs.
- **API Management & Ingress Tier:** WSO2 API Manager (WSO2 APIM) acting as the centralized secure gateway, performing token validation against Asgardeo JWKS, enforcing OAuth2 RBAC scopes, managing rate limits, and emitting a cryptographically signed backend assertion token (`X-JWT-Assertion`).
- **Microservices Application Tier:** Java 21+ and Spring Boot 3.x microservices running behind WSO2 APIM. Services validate APIM's internal assertion signature, establish `TenantContext` & `SecurityContextHolder`, and enforce Hibernate 6 `@TenantId` multi-tenancy.
- **Persistence Tier:** Shared relational database (PostgreSQL / MySQL) with strict column-level discriminator isolation (`tenant_id`).

```
[React SPA]
     │ (OIDC / PKCE Bearer Access Token)
     ▼
[WSO2 API Manager Gateway]
     │ (Validates token against Asgardeo JWKS & enforces OAuth2 Scopes)
     │ (Generates X-JWT-Assertion header)
     ▼
[Spring Boot Microservices] (Tenant Service, Invoice Service, Product Service, etc.)
     │ (SecurityFilter extracts Tenant & Roles -> TenantContext)
     ▼
[Database Layer] (Hibernate 6 @TenantId column discriminator)
```

## 3. System Responsibilities
1. **Frontend (React SPA)**: Presentation only. Presentation scopes (`openid`, `profile`, `roles`, `groups`). No backend secrets or SCIM scopes.
2. **IDP (Asgardeo)**: Identity source of truth, user directories, role assignment, SCIM 2.0 APIs.
3. **Gateway (WSO2 APIM)**: Ingress security, JWKS token validation, scope enforcement, DoS/throttling protection, backend assertion emission.
4. **Microservices (Spring Boot)**: Business domain logic, `X-JWT-Assertion` filter, Hibernate multi-tenant queries, backend M2M SCIM provisioning.
