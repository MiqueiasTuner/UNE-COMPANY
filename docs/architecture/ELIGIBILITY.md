# FIKTA - Eligibility Engine Specification

This document details the architecture, evaluation rules, and logic workflows of the **Eligibility Engine** (`Fikta.Eligibility`), responsible for deciding customer catalog access.

---

## 1. Core Concept

The core question the Eligibility Engine answers for every customer action is:
> **"Is this B2C Customer eligible to access the digital catalog, browse books, and read content right now?"**

To determine this, the engine evaluates a sequence of checks across the customer's parent provider status, their active ERP product subscriptions, mapping tables, catalog access rules, and current financial balance.

---

## 2. Eligibility Evaluation Factors

The engine aggregates data from the following layers:

```
┌───────────────────────────────────────────────────────────────────┐
│                           1. Tenant Status                        │
│               Is the Provider active on the platform?             │
└─────────────────────────────────┬─────────────────────────────────┘
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                         2. Customer Profile                       │
│           Is the Customer active in the local B2B base?           │
└─────────────────────────────────┬─────────────────────────────────┘
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                       3. ERP Product Mapping                      │
│      Find customer's active contracts & products in the ERP       │
│      Map: ExternalProductId (ERP) ──► InternalProductCode        │
└─────────────────────────────────┬─────────────────────────────────┘
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                       4. Catalog Access Rules                     │
│       Does the mapped Product allow access to a specific Catalog?  │
└─────────────────────────────────┬─────────────────────────────────┘
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                     5. Financial & Delinquency                    │
│      Check overdue titles, days late, and grace period settings   │
└─────────────────────────────────┬─────────────────────────────────┘
                                  ▼
                     ┌─────────────────────────┐
                     │  ELIGIBILITY CONFIRMED  │
                     └─────────────────────────┘
```

1.  **Provider Status**: If the parent Provider Tenant is marked as `SUSPENDED` or `INACTIVE` by FIKTA, the engine immediately blocks all B2C customers.
2.  **Customer Status**: If the customer is `SUSPENDED` or `INACTIVE` in the FIKTA database, access is blocked.
3.  **ERP Product Mapping**: Integrations lookup active products or service plans within the Provider's external ERP. These third-party codes (e.g. `serv_voalle_123`) are resolved to internal product tags (e.g. `une_sva_gold`).
4.  **Catalog Access Rules**: Connects the resolved internal product tags to specific digital catalogs (collections of books).
5.  **Financial & Delinquency Rules**: Assesses the customer's payment health in the ERP, checking outstanding billing items.

---

## 3. The Validation Workflow

```
[B2C Client Request]
       │
       ▼
 [Check Provider Status] ──► (Suspended) ──► [Block Access]
       │
       ▼
 [Check Customer Status] ──► (Suspended) ──► [Block Access]
       │
       ▼
 [Call ERP Adapter: Active Contracts]
       │
       ▼
 [Map ERP Product IDs to InternalProductCodes] ──► (No Map Found) ──► [Block Access]
       │
       ▼
 [Check Catalog Access Rules] ──► (Resolve Catalogs)
       │
       ▼
 [Call ERP Adapter: Check Delinquency]
       │
       ▼
 [Evaluate Provider Fin Rules (Grace Period, Days Late)] ──► (Breached) ──► [Block Access]
       │
       ▼
 [Filter & Grant Access to Eligible Catalogs]
```

---

## 4. Financial & Delinquency Rules

Rather than enforcing a rigid block upon any late payment, the engine uses configurable, parameter-driven rules that allow each ISP to balance user retention and collection risk.

### Configuration Parameters (Managed per Provider)
These parameters are stored in the database under the Provider's White Label configuration:

*   **`BlockIfDelinquent`** (Boolean): Defines if the engine should execute financial blocks at all.
*   **`GracePeriodDays`** (Integer): The number of days past the invoice due date during which the customer retains full catalog access. For example, if the due date was August 1st and `GracePeriodDays` is 10, the user has access until August 11th.
*   **`MaxOverdueTitles`** (Integer): The maximum number of unpaid invoices allowed before blocking. If set to 1, the user is blocked on their second unpaid invoice even if within the grace period of the second.
*   **`AllowAccessAfterDelinquency`** (Boolean): Allows partial or restricted catalog access (e.g. only reading books already in the library, but blocking catalog browsing) instead of an absolute lockout.

---

## 5. Security & Processing Rules

> [!IMPORTANT]
> **Rule of Gold**: The Eligibility Engine must execute strictly on the Backend API server. 
> Frontend validation or visibility checks are purely for UI/UX. The client application must NEVER decide catalog access, generate signed book URLs, or fetch metadata without passing the Backend Eligibility checks on every request.
