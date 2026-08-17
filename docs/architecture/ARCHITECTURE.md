# FIKTA - Global Architecture Specification

This document details the software architecture, technical stack, and system design for **FIKTA**, a multi-tenant B2B2C digital book platform.

---

## 1. System Overview & Architecture Topology

The platform operates on a **B2B2C (Business-to-Business-to-Consumer)** model with an added **Integration Layer** to connect to external ERP systems (such as Voalle, ERP X, ERP Y).
- **FIKTA** acts as the Platform Owner (System Master).
- **Provedores de Internet (ISPs)** act as Tenants (B2B Clients).
- **Clientes Finais** act as end consumers (B2C Users) who read digital books.
- **Integration Layer** handles communication with external ERPs to validate customer status, plans, and eligibility.

### Conceptual Architecture Diagram

```
                    FIKTA
                        │
             ┌──────────┴──────────┐
             │                     │
        CORE PLATFORM        INTEGRATION LAYER
             │                     │
             │             ┌───────┼────────┐
             │             │       │        │
             │          Voalle   ERP X    ERP Y
             │
             └───────────┬───────────────┐
                         │
                    B2B PROVIDERS
                         │
                    B2C CUSTOMERS
```

### Layer Responsibilities

1. **Core Platform**: 
   - Contains the core business logic, user management, global book catalog, and reading progress state.
   - It is completely agnostic to specific external ERP details. It only communicates with the Integration Layer via normalized contracts/interfaces.
2. **Integration Layer (ERPs)**: 
   - A modular abstraction layer that defines unified internal interfaces (contracts) for querying customer registrations, active plans/services, and billing/financial statuses.
3. **ERP Adapters (e.g., Voalle Adapter, ERP X Adapter)**: 
   - Concrete implementations of the Integration Layer interfaces. They translate the third-party ERP proprietary APIs (XML, JSON, SOAP) into the normalized internal models of the FIKTA Core.
4. **B2B Providers (Tenants)**: 
   - Independent ISPs. Each provider configuration points to their specific Integration configuration (e.g., Provider A utilizes Voalle, Provider B utilizes ERP X).
5. **B2C Customers**: 
   - Users linked to a Provider. Their access is validated against the Provider's designated ERP adapter.

---

## 2. Recommended Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Admin** | **React 19 + TypeScript + Tailwind CSS** | Direct alignment with the *Tailwind Admin* template. Offers SPA speed, type safety, and rich UI component styling. |
| **Frontend Portal (B2C)** | **React 19 + Tailwind CSS or Bootstrap 5** | Based on the *Bookly* template. Will be built as a responsive, fast-loading SPA optimized for mobile reading. |
| **Backend / API** | **ASP.NET Core Web API (C# / .NET 9)** | Enterprise-grade performance, native dependency injection, powerful middleware execution, and excellent performance characteristics. |
| **Database ORM** | **Entity Framework Core (EF Core)** | Leading C# ORM. Supports DbContext global query filters (essential for automated multi-tenant query isolation) and migrations. |
| **Database** | **PostgreSQL** | Relational capabilities are crucial for complex catalog structures (Books, Authors, Publishers, Categories). Supports robust **Row-Level Security (RLS)** for strong tenant isolation. |
| **Authentication** | **JWT with stateless sessions (Access + Refresh Token)** | Allows decoupled authentication. Tokens will contain metadata for `tenant_id` and user `role`. |
| **File Storage** | **AWS S3 / Supabase Storage + CloudFront CDN** | Secure, highly available object storage for book files (EPUBs/PDFs) and cover images. CDN ensures low-latency delivery. |
| **API Documentation** | **Swagger / OpenAPI** | Out-of-the-box support in ASP.NET Core for documenting, testing, and verifying endpoints with Bearer Auth. |

---

## 3. Layered Architectural Design

### 3.1. Frontend Administrative Dashboard
- **Target Users**: FIKTA Admins/Operators (Platform Master) and Provider Admins/Operators (Tenants).
- **Architecture**: A Single Page Application (SPA) structured with route-based role checks.
- **Branding (White Label)**: Configured dynamically. Upon loading, the application checks the hostname/subdomain, fetches the provider's custom theme metadata (colors, logo, favicon), and injects it into Tailwind/CSS variables.

### 3.2. B2C Book Portal
- **Target Users**: Final Customers of ISPs.
- **Architecture**: Lightweight SPA focused on rapid rendering and mobile responsiveness.
- **Catalog Filtering**: Automatically scoped to the Customer's Provider. No endpoint will expose books outside of the provider's active contracts.

### 3.3. Backend API Gateway & Services
- **Architecture**: RESTful API built on Clean Architecture / Layered Architecture.
- **Tenant Context Resolution**: An ASP.NET Core middleware inspects every request (via subdomain, custom headers, or JWT claims) to extract the active `tenant_id`/`provider_id` and registers it in a scoped lifetime container (`ITenantContext`), making it automatically available to the DbContext and downstream services.

---

## 4. Specific Technical Systems

### 4.1. Authentication & Authorization (RBAC & ABAC)
- **Authentication**: Custom JWT authentication service. For security, passwords will be hashed with `BCrypt` or `PBKDF2` (never stored in plain text).
- **Authorization**: **Role-Based Access Control (RBAC)** enforced at the Controller/Action level in the backend via Policies/Requirements. 
- **B2C JWT Structure**: Contains `customer_id`, `provider_id`, and role `CUSTOMER`.
- **Admin JWT Structure**: Contains `user_id`, `tenant_id` (either `FIKTA` or `PROVIDER_ID`), and the administrative role (e.g., `UNE_ADMIN`, `PROVIDER_ADMIN`).

### 4.2. File Storage & Cover Asset Management
- **Image Cover Assets**: Publicly readable, served via CDN for fast load times.
- **Format**: Uploaded covers are automatically resized and converted to webp format on the backend to minimize bandwidth.

### 4.3. Digital Reading Engine
- **Supported Formats**: EPUB (primary) and PDF (secondary).
- **EPUB Engine**: Integrated with [epub.js](https://github.com/futurepress/epub.js/) on the client-side for dynamic pagination, themes (light, sepia, dark), bookmarking, and progress tracking.
- **PDF Engine**: Integrated with [pdf.js](https://mozilla.github.io/pdf.js/) for smooth rendering.
- **Security & Anti-Piracy**:
  1. **Signed URLs**: Ebooks are stored in private S3 buckets. The backend generates short-lived, signed URLs (e.g., valid for 5 minutes) when a user requests reading access.
  2. **Streaming Decryption**: The reading engine fetches file chunks using the signed URL and reads them directly into memory, preventing easy direct download.
  3. **Watermarking**: Dynamically overlay the customer's email or identifier on PDF pages/EPUB screens to deter screen-shot sharing.

### 4.4. Structured Logging & Observability
- **Application Logs**: Backend writes structured JSON logs (e.g., using Serilog in .NET). Each log message automatically includes the current `tenant_id` (if available), request ID, and route path.
- **Centralized Log Collection**: Logs are forwarded to a collector (e.g., Loki, Datadog, or ElasticSearch) to allow query isolation by `tenant_id`.
- **Metrics & APM**: OpenTelemetry instrumentation tracking:
  - Database query execution times (crucial for tenant indexing performance).
  - API endpoints response latency.
  - Active sessions count per Tenant.

---

## 5. Architectural Quality Attributes

### 5.1. Scalability
As the system scales to hundreds of providers and millions of customers:
- **Database Indexing**: Every query uses composite indexes leading with `tenant_id` or `provider_id`.
- **Read Replicas**: A Postgres primary-replica setup can be introduced where B2C catalog searches run against read replicas.
- **Caching**: Global catalog books metadata, authors, and category taxonomies are cached globally using Redis.

### 5.2. Tenant Security & Compliance
- **Logic Level Isolation**: The backend ORM layer (EF Core) utilizes Global Query Filters to automatically append the active `tenant_id`/`provider_id` to queries. On the database level, PostgreSQL Row-Level Security (RLS) acts as a secondary safety shield.
- **Secret Management**: API credentials, AWS keys, and database passwords are managed through environment variables (`appsettings.json` and system env vars, never committed to git).

