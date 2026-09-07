# Invox - Cloud-Native Multi-Tenant B2B Invoicing SaaS

[![Java](https://img.shields.io/badge/Java-21%2B%20%2F%2025-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x%20%2F%204.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![Asgardeo](https://img.shields.io/badge/Asgardeo%20by%20WSO2-OIDC%20%26%20SCIM-FF7300.svg)](https://wso2.com/asgardeo/)
[![WSO2 APIM](https://img.shields.io/badge/WSO2%20API%20Manager-Gateway-000000.svg)](https://wso2.com/api-manager/)

Invox is an cloud-native **Multi-Tenant B2B Invoicing SaaS** platform designed with enterprise workspace isolation, granular role-based access control (RBAC), and automated tenant lifecycle management. It empowers businesses to securely onboard organizations, manage client registries, build product/service catalogs, and generate professional PDF invoices - all from a single, resilient application deployment.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Architecture Overview](#architecture-overview)
3. [Service & Port Matrix](#service--port-matrix)
4. [Prerequisites](#prerequisites)
5. [Backend Setup (Docker Compose)](#backend-setup-docker-compose)
6. [Frontend Setup (React + Vite)](#frontend-setup-react--vite)
7. [WSO2 Asgardeo Identity Provider Setup](#wso2-asgardeo-identity-provider-setup)
8. [WSO2 API Manager (APIM) Setup](#wso2-api-manager-apim-setup)
9. [Zero-Trust Security & Multi-Tenancy Design](#zero-trust-security--multi-tenancy-design)
10. [Useful Commands & Troubleshooting](#useful-commands--troubleshooting)

---

## Key Features

- **Automated Multi-Tenant B2B Lifecycle**: Self-service organization onboarding provisioning sub-organizations in Asgardeo IDP and creating tenant records in PostgreSQL.
- **Zero-Trust Identity Architecture**:
  - **Frontend SPA**: Strictly uses OIDC with PKCE with presentation scopes (`openid`, `profile`, `email`, `roles`, `groups`). It never receives administrative credentials or SCIM privileges.
  - **Backend M2M**: Administrative actions (sub-organization creation, SCIM 2.0 user provisioning) are performed exclusively by backend services using OAuth 2.0 `client_credentials`.
- **API Gateway Enforcement**: WSO2 API Manager acts as the single entry point, validating Asgardeo tokens, checking OAuth2 RBAC scopes, and generating signed `X-JWT-Assertion` tokens for downstream microservices.
- **Transparent Multi-Tenant Data Isolation**: Shared-schema PostgreSQL database leveraging Hibernate 6 `@TenantId` column discriminator to automatically enforce tenant scoping on all SQL queries.
- **Microservices Domain Architecture**:
  - `tenant-service`: Organization registration, Asgardeo sub-org management, and employee invitation.
  - `user-service`: User synchronization and directory management.
  - `invoice-service`: Invoicing workflows, HTML-to-PDF rendering (OpenHtmlToPdf), and email notifications.
  - `product-service`: Products and billable services catalog.
  - `customer-service`: Client and business partner management.
- **Production-Grade Containerization**: Lightweight multi-stage Alpine Docker images running as unprivileged non-root users (`appuser:appgroup`), orchestrated via Docker Compose.

---

## Architecture Overview

```text
               +----------------------------------------------------+
               |                 React Single Page App              |
               |             (Vite + Tailwind + TypeScript)         |
               +----------------------------------------------------+
                         |                             |
     1. OIDC / PKCE      |                             | 2. API Calls with
     Authentication Flow |                             |    Bearer Access Token
                         v                             v
            +-------------------------+    +--------------------------------+
            |      WSO2 Asgardeo      |    |        WSO2 API Manager        |
            |     (Identity & IAM)    |    |       (Secure API Gateway)     |
            +-------------------------+    +--------------------------------+
                         ^                                     |
                         | 4. Backend M2M SCIM                 | 3. Validates Token (JWKS)
                         |    Provisioning                     |    Generates X-JWT-Assertion
                         |                                     v
            +---------------------------------------------------------------+
            |                  Spring Boot Microservices                    |
            |   [Tenant]    [User]    [Invoice]    [Product]    [Customer]  |
            |    :8081      :8082       :8083        :8084        :8085     |
            |                                                               |
            |      * ApimJwtAssertionFilter extracts Tenant & Roles         |
            |      * Populates TenantContext per thread                     |
            +---------------------------------------------------------------+
                                           |
                                           | 5. Hibernate 6 @TenantId
                                           |    Column Discriminator
                                           v
                               +-----------------------+
                               |  PostgreSQL Database  |
                               |      (invox_db)       |
                               +-----------------------+
```

---

## Service & Port Matrix

| Service / Component | Directory | Port | Runtime / Base | Description |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL** | — | `5432` | `postgres:16-alpine` | Shared relational database (`invox_db`) |
| **tenant-service** | `services/tenant-service` | `8081` | Temurin 25 JRE Alpine | B2B organization provisioning & Asgardeo M2M client |
| **user-service** | `services/user-service` | `8082` | Temurin 25 JRE Alpine | User directory and tenant-user mapping |
| **invoice-service** | `services/invoice-service` | `8083` | Temurin 25 JRE Alpine | Invoice lifecycle, PDF rendering, email alerts |
| **product-service** | `services/product-service` | `8084` | Temurin 21 JRE Alpine | Product catalog and pricing |
| **customer-service** | `services/customer-service` | `8085` | Temurin 25 JRE Alpine | Customer relationship management |
| **Frontend SPA** | `frontend/` | `5173` | Node.js 18+ / Vite | React user portal with Asgardeo React SDK |
| **WSO2 APIM Gateway** | Gateway Ingress | `8243` / `9443` | WSO2 APIM 4.x | Secure API Gateway & Token Assertion Provider |

---

## Prerequisites

Ensure the following tools are installed on your workstation:

- **Docker Desktop** (version 24.x or higher) with Docker Compose v2.
- **Node.js** (v18.x or higher) & **npm** (v9.x or higher).
- **Java 21 or 25 SDK** (optional, only needed for local CLI Maven builds without Docker).
- **Git** & **GitHub CLI (`gh`)**.
- A **WSO2 Asgardeo Cloud account** ([https://asgardeo.io](https://asgardeo.io)).

---

## Backend Setup (Docker Compose)

The easiest way to run the entire backend microservices ecosystem and database is using Docker Compose.

### Step 1: Navigate to the `services` directory
```bash
cd services
```

### Step 2: Configure Environment Variables
Copy the environment template `.env.example` to `.env`:
```bash
# On Linux / macOS / PowerShell:
cp .env.example .env
```

Open `.env` and fill in your Asgardeo credentials and database details:
```env
# Database Settings
POSTGRES_DB=invox_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=post1234
POSTGRES_PORT=5432

# Service Ports
TENANT_SERVICE_PORT=8081
USER_SERVICE_PORT=8082
INVOICE_SERVICE_PORT=8083
PRODUCT_SERVICE_PORT=8084
CUSTOMER_SERVICE_PORT=8085

# Asgardeo M2M Client (for tenant-service)
ASGARDEO_ROOT_ORG=your_asgardeo_root_org
ASGARDEO_CLIENT_ID=your_asgardeo_m2m_client_id
ASGARDEO_CLIENT_SECRET=your_asgardeo_m2m_client_secret
ASGARDEO_SPA_CLIENT_ID=your_asgardeo_spa_client_id

# SMTP Settings (Gmail or any SMTP host)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Step 3: Build and Start All Services
```bash
docker compose up -d
```

Docker Compose will automatically:
1. Initialize the PostgreSQL 16 container with healthchecks.
2. Build multi-stage Docker images for each microservice using Maven wrapper.
3. Wait for PostgreSQL to become healthy before starting the Spring Boot microservices.
4. Join all services on the `invox-network` bridge.

### Step 4: Verify Running Services
Check container status:
```bash
docker compose ps
```
You should see all 6 containers (`invox-postgres`, `invox-tenant-service`, `invox-user-service`, `invox-invoice-service`, `invox-product-service`, `invox-customer-service`) running.

Verify health endpoints:
```bash
# Product Service
curl http://localhost:8084/actuator/health

# Customer Service
curl http://localhost:8085/actuator/health
```

### Step 5: Viewing Logs
```bash
# Follow logs for all services
docker compose logs -f

# Follow logs for a specific service
docker compose logs -f tenant-service
```

### Step 6: Stopping Services
```bash
# Stop containers (preserves database data volume)
docker compose down

# Stop containers and wipe database data (clean restart)
docker compose down -v
```

---

## Frontend Setup (React + Vite)

The frontend is a modern React application built with TypeScript, Tailwind CSS, and the `@asgardeo/react` SDK.

### Step 1: Navigate to the `frontend` directory
```bash
cd frontend
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Configure Frontend Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your Asgardeo SPA application details and API Gateway URL:
```env
# Asgardeo OIDC Identity Provider Configuration
VITE_ASGARDEO_CLIENT_ID=your_asgardeo_spa_client_id
VITE_ASGARDEO_BASE_URL=https://api.asgardeo.io/t/your_asgardeo_root_org
VITE_ASGARDEO_SIGN_IN_REDIRECT_URL=http://localhost:5173/callback
VITE_ASGARDEO_SIGN_OUT_REDIRECT_URL=http://localhost:5173
VITE_ASGARDEO_SCOPES=openid,profile,email,roles,groups

# Backend API Base URL
# Point to WSO2 APIM Gateway in production, or direct service port for local development:
VITE_API_BASE_URL=http://localhost:8081
```

### Step 4: Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:5173`**.

---

## WSO2 Asgardeo Identity Provider Setup

Invox uses Asgardeo by WSO2 for customer identity, organization management (B2B sub-organizations), and role-based access control.

### 1. Create a Root Organization
1. Sign in to [Asgardeo Console](https://asgardeo.io).
2. Note your root organization name (e.g. `invox1`). This will be used in `ASGARDEO_ROOT_ORG` and `VITE_ASGARDEO_BASE_URL`.

### 2. Create the Frontend SPA Application
1. In the Asgardeo Console, go to **Applications** > **New Application**.
2. Select **Single-Page Application** > **React**.
3. Set the application name (e.g., `Invox-Frontend-SPA`).
4. Under **Protocol**:
   - Grant Types: **Authorization Code** with **PKCE**.
   - Authorized Redirect URLs:
     - `http://localhost:5173/callback`
   - Allowed Origins:
     - `http://localhost:5173`
5. Under **User Attributes / Scopes**:
   - Ensure `openid`, `profile`, `email`, `roles`, and `groups` are selected.
6. Under **Advanced / Organization Management**:
   - Enable **Share with sub-organizations** so that every sub-organization created by tenants can log in through the same application.
7. Copy the generated **Client ID** and set it as:
   - `VITE_ASGARDEO_CLIENT_ID` in `frontend/.env`
   - `ASGARDEO_SPA_CLIENT_ID` in `services/.env`

### 3. Create the Backend M2M Application (Client Credentials)
The `tenant-service` acts as an administrative identity orchestrator to create sub-organizations and provision admin users.
1. In the Asgardeo Console, go to **Applications** > **New Application**.
2. Select **Standard-Based Application** or **Machine-to-Machine (M2M)**.
3. Select **OAuth 2.0 / OpenID Connect**.
4. Set Grant Type to **Client Credentials**.
5. Assign the following API scopes / roles to the application:
   - `internal_organization_create`
   - `internal_organization_view`
   - `internal_user_mgt_create`
   - `internal_user_mgt_view`
   - `internal_user_mgt_update`
   - `internal_user_mgt_delete`
   - SCIM 2.0 API Scopes
6. Copy the generated **Client ID** and **Client Secret** and configure them in `services/.env`:
   - `ASGARDEO_CLIENT_ID=<your_m2m_client_id>`
   - `ASGARDEO_CLIENT_SECRET=<your_m2m_client_secret>`

---

## WSO2 API Manager (APIM) Setup

WSO2 API Manager acts as the enterprise gateway in front of all Invox microservices. It terminates client connections, validates tokens against Asgardeo, and emits internal assertion tokens.

### 1. Register Asgardeo as Key Manager
1. Log in to the WSO2 APIM **Admin Portal** (`https://<apim-host>:9443/admin`).
2. Go to **Key Managers** > **Add Key Manager**.
3. Fill in the Key Manager configuration:
   - **Name**: `Asgardeo`
   - **Type**: `Custom` or `OpenID Connect`
   - **Well-Known URL / Discovery Endpoint**:
     `https://api.asgardeo.io/t/<root-org>/oauth2/token/.well-known/openid-configuration`
   - **JWKS Endpoint**:
     `https://api.asgardeo.io/t/<root-org>/oauth2/jwks`
   - **Issuer**:
     `https://api.asgardeo.io/t/<root-org>/oauth2/token`
4. Save and enable the Key Manager.

### 2. Enable Backend JWT Assertion Generation
To allow microservices to receive the authenticated user identity without calling Asgardeo on every request, APIM issues an `X-JWT-Assertion` header.

In APIM's `<APIM_HOME>/repository/conf/deployment.toml`:
```toml
[apim.jwt]
enable = true
encoding = "base64"
generator_impl = "org.wso2.carbon.apimgt.keymgt.token.JWTGenerator"
claim_dialect = "http://wso2.org/claims"
header = "X-JWT-Assertion"
signing_algorithm = "SHA256withRSA"
```

### 3. Create & Publish APIs in Publisher Portal
In the WSO2 APIM **Publisher Portal** (`https://<apim-host>:9443/publisher`), create an API for each microservice:

| API Name | Context | Version | Target Backend Endpoint |
| :--- | :--- | :--- | :--- |
| **Tenant API** | `/api/v1/tenants` | `1.0.0` | `http://tenant-service:8081` |
| **User API** | `/api/v1/users` | `1.0.0` | `http://user-service:8082` |
| **Invoice API** | `/api/v1/invoices` | `1.0.0` | `http://invoice-service:8083` |
| **Product API** | `/api/v1/products` | `1.0.0` | `http://product-service:8084` |
| **Customer API** | `/api/v1/customers` | `1.0.0` | `http://customer-service:8085` |

For each API:
- Select **Key Manager**: Check **Asgardeo**.
- Under **Resources**, define the operations (`GET`, `POST`, `PUT`, `DELETE`).
- Deploy to Gateway and click **Publish**.

---

## Zero-Trust Security & Multi-Tenancy Design

### 1. Insecure Direct Object Reference (IDOR) Prevention
- **Rule**: Client applications **never** send `tenantId` in request query parameters, URL path variables, or body payloads.
- **Enforcement**:
  1. The user logs in via Asgardeo.
  2. The frontend sends the Bearer access token to WSO2 APIM.
  3. APIM validates the token and emits `X-JWT-Assertion` containing the validated `organization_id` or `tenant_id`.
  4. Spring Boot's filter parses `X-JWT-Assertion` and sets `TenantContext.setCurrentTenant(tenantId)`.

### 2. ThreadLocal Lifecycle Management
All Spring Boot services manage `TenantContext` safely in a `try-finally` block to prevent cross-tenant thread pollution in pooled servlet containers:

```java
try {
    TenantContext.setCurrentTenant(tenantId);
    filterChain.doFilter(request, response);
} finally {
    TenantContext.clear();
    SecurityContextHolder.clearContext();
}
```

### 3. Hibernate 6 Automatic Discriminator Isolation
Entities declare:
```java
@Entity
@Table(name = "invoices")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private String tenantId;

    // ...
}
```
Hibernate automatically appends `AND tenant_id = :currentTenant` to every SQL query and automatically sets `tenant_id` on entity creation.

---

## Useful Commands & Troubleshooting

### Docker Quick Diagnostics
```bash
# Check running container statuses
docker compose ps

# View real-time resource utilization
docker stats

# Access PostgreSQL CLI inside container
docker exec -it invox-postgres psql -U postgres -d invox_db

# Rebuild an individual service after modifying source code
docker compose build invoice-service
docker compose up -d invoice-service
```

### Common Issues & Resolutions

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **PostgreSQL Connection Refused** | Microservice started before database was ready | Ensure `depends_on` has `condition: service_healthy` in `docker-compose.yml`. |
| **Asgardeo Redirect URI Mismatch** | SPA redirect URI does not match Asgardeo config | Ensure `http://localhost:5173/callback` is listed under **Authorized Redirect URLs** in Asgardeo SPA application. |
| **Port Collision on Host** | Another local process (e.g. local Postgres or Tomcat) occupies port | Change the published host port in `.env` (e.g., change `POSTGRES_PORT=5433` or `INVOICE_SERVICE_PORT=8093`). |
| **CORS Errors in Browser** | Frontend origin blocked by Gateway or Service | Ensure `http://localhost:5173` is added to Allowed Origins in Asgardeo and WSO2 APIM CORS configuration. |
| **Actuator Health 503** | Mail health indicator DOWN due to unconfigured SMTP | Normal during local development if SMTP credentials are blank; database and core microservice functionality remain fully operational. |

---

## Contributing & Development Guidelines

- **Branching Strategy**: Never commit directly to `main`. Create feature branches (`feat/<feature-name>`, `task/<task-name>`, `fix/<issue-description>`).
- **Commit Messages**: Follow Conventional Commits (`feat: ...`, `fix: ...`, `chore: ...`).
- **Issue Tracking**: Use GitHub CLI (`gh issue create`) and link PRs to their respective issues.
