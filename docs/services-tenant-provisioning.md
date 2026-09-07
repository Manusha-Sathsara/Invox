# Tenant Provisioning Service Specification & Verification

## 1. Overview
The `tenant-service` handles B2B multi-tenant organization provisioning and user onboarding, orchestrating Asgardeo IDP sub-organizations with local PostgreSQL tenant records.

## 2. API Endpoints
| HTTP Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/actuator/health` | Public | Service health & liveness check |
| `GET` | `/api/v1/tenants/check-subdomain/{subdomain}` | Public | Checks if a tenant subdomain is available |
| `GET` | `/api/v1/tenants/public-list` | Public | Lists registered tenants for testbed selection |
| `POST` | `/api/v1/tenants/register` | Public | Self-service B2B sub-org creation + admin provisioning + DB save |
| `DELETE` | `/api/v1/tenants/{id}` | Admin | Deletes tenant record and removes Asgardeo sub-organization |
| `GET` | `/api/v1/tenants/me` | Protected (JWT) | Resolves current tenant profile using `TenantContext` |
| `POST` | `/api/v1/tenants/users/invite` | Protected (JWT) | Invites an employee to the tenant sub-organization |
| `GET` | `/api/v1/tenants/users` | Protected (JWT) | Lists all members of the tenant organization |

## 3. Live IDP Verification Log
- **Health Check (`GET /actuator/health`):** Returned `{"status":"UP"}` (HTTP 200).
- **Subdomain Check (`GET /api/v1/tenants/check-subdomain/sampletenant`):** Returned `{"available":true}` (HTTP 200).
- **Public List (`GET /api/v1/tenants/public-list`):** Successfully queried PostgreSQL and returned registered active tenants.
- **B2B Tenant Registration (`POST /api/v1/tenants/register`):** 
  - Sub-organization created in Asgardeo root organization `pixelaura`.
  - Admin user created via SCIM2.
  - SPA application shared with child sub-organization.
  - Record persisted in PostgreSQL `tenants` and `tenant_users` tables.
- **Tenant Teardown (`DELETE /api/v1/tenants/{id}`):** Successfully removed sub-organization from Asgardeo and cleared records from database.
