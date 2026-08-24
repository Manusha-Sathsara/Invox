# Invox Guidelines & Standards

- **Git & Branching**: Dedicated branches for every feature/task (`feat/*`, `task/*`, `fix/*`). Clean conventional commits referencing GitHub issues.
- **GitHub Issues & PM**: Use `gh` CLI with `.github/ISSUE_TEMPLATE` formats. Manage subtasks and keep the Invox project board synchronized.
- **Guidance for Beginners**: Provide clear step-by-step guidance, explaining the "why" and "how" before making major moves.
- **Asgardeo & WSO2 APIM**: Always reference current Asgardeo documentation (`https://asgardeo.io/docs/`). No frontend secrets or admin scopes.
- **Zero-Trust Multi-Tenancy**: `X-JWT-Assertion` validation in backend services, `TenantContext` lifecycle sanitation with `finally` block, Hibernate 6 `@TenantId` automatic query filtering.
- **Documentation**: Continuously maintain architecture, ADRs, and guides in `/docs`.
