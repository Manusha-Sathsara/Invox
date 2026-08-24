# Project Invox - AI Agent Rules & Development Guidelines

## 1. Project Overview & Architecture
Invox is a Multi-Tenant B2B Invoicing SaaS platform engineered with zero-trust security, automated identity lifecycle management, and transparent multi-tenant data isolation.

### Technology Stack:
- **Frontend**: React Single Page Application (SPA) with Vite, Tailwind CSS, TypeScript, and `@asgardeo/react` SDK.
- **Identity Provider (IDP)**: Asgardeo by WSO2 (OIDC PKCE for frontend, SCIM 2.0 & M2M Client Credentials for backend provisioning).
- **API Gateway**: WSO2 API Manager (WSO2 APIM) validating Asgardeo tokens, enforcing OAuth2 RBAC scopes, and generating `X-JWT-Assertion` for internal microservices.
- **Backend Microservices**: Java 21+ & Spring Boot 3.x microservices running behind WSO2 APIM. Services intercept `X-JWT-Assertion`, manage `TenantContext`, and enforce Hibernate 6 `@TenantId` multi-tenancy data isolation.
- **Database**: PostgreSQL / MySQL with shared-schema column-level discriminator isolation (`tenant_id`).
- **DevOps**: Docker, Docker Compose, Git, GitHub CLI (`gh`).

---

## 2. Git & Version Control Rules
1. **Branching Strategy**:
   - Never commit directly to `main` without a proper workflow.
   - For every task, feature, or bugfix, create a dedicated branch (e.g., `feat/<feature-name>`, `task/<task-name>`, `fix/<issue-description>`).
   - Keep branches focused and short-lived.
2. **Commit Messages**:
   - Write clear, conventional commit messages: `feat: ...`, `fix: ...`, `chore: ...`, `refactor: ...`, `docs: ...`, `test: ...`.
   - Always reference relevant GitHub issue numbers in commits (e.g., `feat(tenant-service): add SCIM provisioning (fixes #15)`).

---

## 3. GitHub Issue & Project Management Rules
1. **Issue Creation & Tracking**:
   - Use GitHub CLI (`gh`) to create, update, link, and close issues.
   - Always align with existing issue templates in `.github/ISSUE_TEMPLATE/` (`task.yml`, `new-feature.yml`, `bug.yml`, `improvement.yml`).
   - Break down large tasks into structured subtasks with checkboxes.
   - Keep GitHub Projects (Invox project board) updated with current progress and status columns.
2. **Step-by-Step Approval**:
   - As the user is learning and prefers clear guidance, explain each action step-by-step before performing critical operations.
   - Confirm and clarify with the user whenever making architectural or breaking decisions.

---

## 4. Asgardeo & WSO2 API Manager Integration Rules
1. **Always Use Updated Documentation**:
   - Asgardeo and WSO2 APIs evolve rapidly. Always search and consult official documentation from Asgardeo (`https://asgardeo.io/docs/`) and WSO2 API Manager.
2. **Zero-Trust Security Guardrails**:
   - **Frontend**: The React SPA must strictly use presentation scopes (`openid`, `profile`, `roles`, `groups`). It must **NEVER** receive administrative SCIM scopes or client secrets.
   - **No Tenant ID via Request Params/Body**: Microservices must reject `tenantId` passed via query parameters or body payloads from client requests to prevent IDOR attacks.
   - **Gateway Assertion**: Tenant identity and roles must only be extracted from the cryptographically verified `X-JWT-Assertion` header emitted by WSO2 APIM.
   - **ThreadLocal Cleanup**: In Spring Boot filters, `TenantContext` must always be populated in a `try` block and cleared in a `finally` block (`TenantContext.clear()`) to avoid cross-tenant memory leakage.
   - **Backend SCIM & M2M**: Administrative provisioning in Asgardeo is executed exclusively by backend services using OAuth 2.0 `client_credentials` grant.

---

## 5. Documentation Maintenance
- Maintain updated architectural, technical, and operational documentation in the `/docs` directory.
- Keep records of architectural decisions (ADRs), system topology, API specifications, and troubleshooting logs.
