# FIKTA - Roles and Permissions Specification

This document defines the Role-Based Access Control (RBAC) strategy, scopes, and initial roles for the FIKTA platform.

---

## 1. Authorization Strategy

The platform implements a hybrid **RBAC (Role-Based Access Control)** and **ABAC (Attribute-Based Access Control)** system:
- **RBAC**: Roles determine which API endpoints are accessible.
- **ABAC / Tenant Scopes**: The tenant context restricts operations to data belonging to the user's tenant.

```
                      ┌──────────────────────┐
                      │    Authentication    │
                      └──────────┬───────────┘
                                 ▼
                      ┌──────────────────────┐
                      │      JWT Valid?      │
                      └──────────┬───────────┘
                                 ▼
                      ┌──────────────────────┐
                      │   RBAC Check: Role   │
                      │  Matches Endpoint?   │
                      └──────────┬───────────┘
                                 ▼
                      ┌──────────────────────┐
                      │  ABAC Check: Tenant  │
                      │ Matches Data Owner?  │
                      └──────────┬───────────┘
                                 ▼
                      ┌──────────────────────┐
                      │    Execute Query     │
                      └──────────────────────┘
```

---

## 2. Role Definitions & Scopes

### 2.1. Global Context Roles (FIKTA)
These roles operate at the system level and have visibility across all tenants.

| Role | Scope | Description / Permissions |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | Global (System-wide) | • Full write/read access to all system tables.<br>• Manage platform-level configurations.<br>• Create and delete Provider Tenants.<br>• Direct database access/maintenance tools. |
| **UNE_ADMIN** | Global (System-wide) | • Onboard and manage B2B Providers.<br>• Manage the global book catalog (create/edit Books, Authors, Categories, Publishers).<br>• Manage licensing, suppliers, and billing rules.<br>• View global reporting dashboards. |
| **UNE_OPERATOR** | Global (System-wide) | • View provider information (read-only).<br>• Create and edit books, authors, and metadata in the catalog.<br>• Manage catalog taxonomies (categories, tags).<br>• Assist in provider catalog integrations. |

### 2.2. Tenant Context Roles (Providers)
These roles are bound to a specific `tenant_id`. They have no access to other tenants' data.

| Role | Scope | Description / Permissions |
| :--- | :--- | :--- |
| **PROVIDER_ADMIN** | Tenant-bound (`tenant_id`) | • Configure White Label settings (logo, colors, custom domain).<br>• Onboard and manage B2C Customers.<br>• Select which books from the global catalog are active in their portal.<br>• View local usage, billing, and reading analytics. |
| **PROVIDER_OPERATOR** | Tenant-bound (`tenant_id`) | • Create, suspend, or update B2C Customer profiles.<br>• Manage customer support queries.<br>• View local reports. |

### 2.3. B2C Consumer Role
This role represents the end-user.

| Role | Scope | Description / Permissions |
| :--- | :--- | :--- |
| **CUSTOMER** | Customer-bound | • Authenticate via their provider's login.<br>• Search and browse the provider's active catalog.<br>• Add books to personal library and favorites.<br>• Read digital books, log progress, and save bookmarks. |

---

## 3. Explicit Permissions Matrix

| Module | Action | SUPER_ADMIN | UNE_ADMIN | UNE_OPERATOR | PROVIDER_ADMIN | PROVIDER_OPERATOR | CUSTOMER |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Providers** | Create / Onboard | Yes | Yes | No | No | No | No |
| | Edit Config / Status | Yes | Yes | No | No | No | No |
| | Custom White Label | Yes | Yes | No | Yes | No | No |
| **Global Catalog** | Create / Edit Book | Yes | Yes | Yes | No | No | No |
| | Manage Authors/Pubs | Yes | Yes | Yes | No | No | No |
| | Upload Book Files | Yes | Yes | Yes | No | No | No |
| **Tenant Catalog** | Active / Deactivate | Yes | Yes | No | Yes | No | No |
| **B2C Customers** | Create / Edit | Yes | No | No | Yes | Yes | No |
| | View Profiles | Yes | Yes | No | Yes | Yes | No |
| **Reading & Library** | Read Book Pages | Yes | Yes | Yes | Yes | Yes | Yes (local only) |
| | Add Favorite / Bookmark | No | No | No | No | No | Yes (local only) |
| **System Settings** | Edit API Secrets | Yes | No | No | No | No | No |

---

## 4. Backend Permission Enforcement Rules

1. **Role-Based Guards**:
   - The backend checks the user's role before accessing endpoints. Decorators like `@Roles(Role.PROVIDER_ADMIN)` in NestJS block access early.
2. **Context Validation (Mandatory)**:
   - For all tenant-bound actions (e.g. `GET /api/v1/customers/:id`), the backend must verify that the requested customer's `provider_id` matches the calling administrator's `tenant_id`.
   - Never rely on the client frontend to supply or limit the queries.
3. **Admin Actions Auditing**:
   - Every modification made by administrative roles (`SUPER_ADMIN`, `UNE_ADMIN`, `PROVIDER_ADMIN`) must be logged in an audit table detailing: `user_id`, `tenant_id`, `action`, `entity_type`, `entity_id`, and `timestamp`.
