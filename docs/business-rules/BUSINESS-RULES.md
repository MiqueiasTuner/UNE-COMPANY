# FIKTA - Core Business Rules

This document outlines the mandatory logical constraints, operational boundaries, and business rules governing the FIKTA platform.

---

## 1. Tenancy and Access Rules (Multi-Tenancy)

#### Rule 1: Tenant Provider Isolation
- **Rule**: A Provider (including its administrators, operators, and customers) is strictly prohibited from accessing, viewing, or modifying data, logs, or reports belonging to another Provider.
- **Enforcement**: Automatically enforced via PostgreSQL Row-Level Security (RLS) and query filters on the EF Core DbContext level.

#### Rule 2: Centralized Catalog Control
- **Rule**: FIKTA is the sole entity authorized to register, edit, or delete books, authors, publishers, and categories within the global catalog. Providers have read-only access.
- **Enforcement**: Enforced by check constraints, database triggers, and backend controller Role Guards (`UNE_ADMIN`, `UNE_OPERATOR`).

#### Rule 3: Provider-Book Whitelisting (Scope of Availability)
- **Rule**: A book is only visible and accessible to the B2C customers of a given Provider if it is explicitly associated with that Provider via the `ProviderBook` relation.
- **Enforcement**: Catalog queries automatically join the `provider_books` table using the active `provider_id`.

#### Rule 4: Absolute Database Multi-Tenancy (RLS)
- **Rule**: The database must utilize PostgreSQL Row-Level Security (RLS) to safeguard cross-tenant data. Every query executed in a tenant context must automatically restrict the session to `tenant_id` or `provider_id`.
- **Enforcement**: Implemented at the Postgres layer using security policies and initialized by the backend context on connection checkout.

---

## 2. Customer and ERP Onboarding Rules

#### Rule 5: Backend-Driven Customer Registration
- **Rule**: Customer registration must occur automatically in the backend after verifying and validating their document (CPF/CNPJ) and contract details within the integrated external ERP.
- **Enforcement**: The import customer endpoint queries the Integration Layer, normalizes the data, and persists it.

#### Rule 6: Secure Secrets Management
- **Rule**: No external ERP credentials (such as client IDs, client secrets, tokens, syndata, or integration keys) may be hardcoded or saved inside the source code or version control repository.
- **Enforcement**: Settings are encrypted in the database, and environment variables are used for app-level secrets.

#### Rule 7: End-to-End Security (Backend Verification)
- **Rule**: All role checks, tenant boundaries, and customer eligibility rules must be validated and processed on the backend API layer. UI visibility rules (hiding buttons/pages) are strictly for user experience (UX) and do not constitute security.
- **Enforcement**: Endpoints require JWT authentication and execute policies to verify context before resolving assets.

#### Rule 8: Product Mapping (ExternalProductMapping)
- **Rule**: The link between services/plans contracted in the ERP and catalog access in the FIKTA Core must be defined through the `ExternalProductMapping` mapping entity.
- **Enforcement**: Maps `ExternalProductId` (from the ERP) to `InternalProductCode` (defined in the Core catalog).

---

## 3. Eligibility & Delinquency Rules

#### Rule 9: Eligibility Engine Verification
- **Rule**: A B2C customer is only eligible to log in, browse, or read books if they possess an active contract in the ERP, with a service mapped to a FIKTA Core catalog.
- **Enforcement**: Checked on authentication and refresh token workflows by calling the Eligibility Engine.

#### Rule 10: Parametric Delinquency Rules
- **Rule**: Access block policies for past-due invoices must be configurable per Provider (using parameters like `GracePeriodDays`, `MaxOverdueTitles`, and `AllowAccessAfterDelinquency`).
- **Enforcement**: The Eligibility Engine reads these parameters from the Provider's configuration before granting/refusing access.

---

## 4. Branding & Communication Rules

#### Rule 11: Dynamic Brand Identity (White Label)
- **Rule**: All B2C portal user interfaces, custom subdomains, and automated email communications must inherit the branding assets, logo, colors, and styling variables of the customer's corresponding B2C Provider.
- **Enforcement**: Enforced by CSS variable injection in the frontend and template compilation in the Communication Module.

#### Rule 12: Stateless Tenant Context via JWT
- **Rule**: The backend issues stateless JWT tokens containing user details and context claims (`userId`, `role`, `tenantId`, `providerId`).
- **Enforcement**: Handled by the authentication module; middleware inspects the token on every request.

#### Rule 13: Decoupled API Boundaries
- **Rule**: The frontend (B2C portal or Admin dashboard) must **NEVER** communicate with third-party ERP APIs directly. All ERP lookups and actions must route through the backend Integration Layer.
- **Enforcement**: Firewalls block direct outbound calls, and APIs are only exposed from the Core backend.

#### Rule 14: Structured Audit Logging
- **Rule**: All integration transactions, API calls, and administrative configuration updates must be permanently recorded in audit logs.
- **Enforcement**: Captured via EF Core interceptors and log writers in the database and centralized log systems.
