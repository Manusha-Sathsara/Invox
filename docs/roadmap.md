# Project Invox - Development Roadmap & Milestone Status

## Milestone 1: Identity Plane & API Gateway Ingress (Completed ✅)
- **Asgardeo Root Organization:** Configured root tenant (`pixelaura`) with custom claims and B2B organizational hierarchy.
- **Machine-to-Machine (M2M) Application:** Registered with `client_credentials` grant and SCIM2 / Organization management scopes.
- **WSO2 API Manager Integration:** Registered Asgardeo as External Key Manager, mapped OAuth2 scopes to roles, and enabled `X-JWT-Assertion` backend header emission.
- **Federated Authentication:** Configured Google OAuth 2.0 / OIDC Identity Provider integration.
- **Tenant Provisioning Microservice:** Live verified B2B Sub-Organization provisioning, SPA sharing, SCIM admin creation, and database persistence (#18).

---

## Milestone 2: Frontend UI & Authentication Integration (In Progress 🚀 - Issue #10)
- **Figma Export Integration:** Assemble React SPA components, responsive navigation, and Tailwind CSS design tokens.
- **Asgardeo React SDK (`@asgardeo/react`):** Configure OIDC PKCE flow with dynamic sub-organization routing and role-based views (`Invox_admin`, `Invox_accountant`, `Invox_viewer`).
- **Tenant Service Connectivity:** Integrate Self-Service Registration, Subdomain Validation, and User Invitation forms.

---

## Milestone 3: Business Microservices & Multi-Tenant Data Layer (Planned 📋)
- **Customer Service (#19):** Multi-tenant client management with Hibernate 6 `@TenantId` column discriminator.
- **Product Service (#20):** Multi-tenant product catalog and pricing directory.
- **Invoice Service (#21):** Multi-tenant invoice generation, line item calculations, state machines, and PDF export.
