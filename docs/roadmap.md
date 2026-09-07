# Project Invox - Development Roadmap & Milestone Status

## Milestone 1: Identity Plane & API Gateway Ingress (Completed ✅)
- **Asgardeo Root Organization:** Configured root tenant (`pixelaura`) with custom claims and B2B organizational hierarchy.
- **Machine-to-Machine (M2M) Application:** Registered with `client_credentials` grant and SCIM2 / Organization management scopes.
- **WSO2 API Manager Integration:** Registered Asgardeo as External Key Manager, mapped OAuth2 scopes to roles, and enabled `X-JWT-Assertion` backend header emission.
- **Federated Authentication:** Configured Google OAuth 2.0 / OIDC Identity Provider integration.
- **Tenant Provisioning Microservice:** Live verified B2B Sub-Organization provisioning, SPA sharing, SCIM admin creation, and database persistence (#18).

---

## Milestone 2: Frontend UI & Authentication Integration (Completed ✅ - Issues #2, #10)
- **Figma Export Integration:** Imported React SPA components, responsive navigation, and Tailwind CSS design tokens (`feat/10-frontend-ui-asgardeo-integration`).
- **Asgardeo Configuration:** Configured root organization `pixelaura`, SPA Client ID `pyfb1DKeI8kklfLqIyEfXZc5Urka`, and presentation scopes (`openid`, `profile`, `email`, `roles`, `groups`).
- **Live Tenant Registration & Subdomain Validation:** Integrated with Spring Boot `tenant-service` endpoints (`POST /api/v1/tenants/register` and `GET /api/v1/tenants/check-subdomain/{subdomain}`).
- **Dynamic Organization Workspace Switcher:** Dynamically loads active registered tenants from `GET /api/v1/tenants/public-list`.
- **Team Invitations & User Management:** Connected team invite modal to backend SCIM2 provisioning (`POST /api/v1/tenants/users/invite`).

---

## Milestone 3: Business Microservices & Multi-Tenant Data Layer (Next Focus 🚀)
- **Customer Service (#19):** Multi-tenant client management with Hibernate 6 `@TenantId` column discriminator.
- **Product Service (#20):** Multi-tenant product catalog and pricing directory with `@TenantId`.
- **Invoice Service (#21):** Multi-tenant invoice generation, line item calculations, status state machines, and PDF export with `@TenantId`.
