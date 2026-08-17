# FIKTA - Integration Layer Specification

This document details the architecture, design, contracts, and patterns of the **Integration Layer** in the FIKTA platform, responsible for linking the core system to external ERPs.

---

## 1. Concept of the Integration Layer

To prevent the core platform from depending on a specific third-party ERP (such as ERPVoalle), the platform incorporates a decoupled **Integration Layer**. This layer isolates proprietary formats, API protocols (REST, SOAP, XML), and communication quirks behind a set of clean, normalized internal interfaces (contracts).

```
  ┌─────────────────────────────────────────────────────────┐
  │                   FIKTA - Core                     │
  └───────────────────────────┬─────────────────────────────┘
                              │
                              ▼
  ┌─────────────────────────────────────────────────────────┐
  │                 Integration Interfaces                  │
  │  (IExternalCustomerProvider, IExternalFinancial...)     │
  └───────────────────────────┬─────────────────────────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
     ┌───────────────┐┌───────────────┐┌───────────────┐
     │Voalle Adapter ││ ERP X Adapter ││ ERP Y Adapter │
     └───────┬───────┘└───────┬───────┘└───────┬───────┘
             │                │                │
             ▼                ▼                ▼
     ┌───────────────┐┌───────────────┐┌───────────────┐
     │  Voalle API   ││   ERP X API   ││   ERP Y API   │
     └───────────────┘└───────────────┘└───────────────┘
```

### Key Terminology

*   **Integration Layer**: The global architectural layer defining unified domain contracts, data models, and workflow specifications.
*   **ERP Adapter**: Concrete C# classes implementing the unified integration interfaces. For example, the `VoalleAdapter` consumes the Voalle Third-Party Web Services and returns normalized domain objects.
*   **Provider Integration**: ERP configurations owned and managed by B2B Provider Tenants. Used for validating their specific B2C customer bases.
*   **FIKTA Master Integration**: An ERP configuration managed by the FIKTA platform owners. Used to audit, sync, or manage general billing or catalog services.

---

## 2. Core Integration Interfaces

These interfaces are defined in the domain layer (`Fikta.Domain`) and represent the unified API contracts.

### 2.1. Customer Data Provider (`IExternalCustomerProvider`)
Retrieves customer registration details, contact info, and active contracts from the ERP.
```csharp
public interface IExternalCustomerProvider
{
    Task<NormalizedCustomer> GetCustomerByDocumentAsync(string document, IntegrationSettings settings);
    Task<NormalizedCustomer> GetCustomerByIdAsync(string externalId, IntegrationSettings settings);
    Task<IEnumerable<NormalizedContract>> GetCustomerContractsAsync(string customerExternalId, IntegrationSettings settings);
}
```

### 2.2. Service Provider (`IExternalServiceProvider`)
Handles services activated or bound to the client.
```csharp
public interface IExternalServiceProvider
{
    Task<IEnumerable<NormalizedService>> GetActiveServicesByContractAsync(string contractExternalId, IntegrationSettings settings);
}
```

### 2.3. Product Provider (`IExternalProductProvider`)
Retrieves products, plans, or catalogs configured in the ERP.
```csharp
public interface IExternalProductProvider
{
    Task<IEnumerable<NormalizedProduct>> ListProductsAsync(IntegrationSettings settings);
}
```

### 2.4. Financial Provider (`IExternalFinancialProvider`)
Checks financial invoices, due dates, delinquency periods, and balance.
```csharp
public interface IExternalFinancialProvider
{
    Task<NormalizedFinancialStatus> GetCustomerFinancialStatusAsync(string customerExternalId, IntegrationSettings settings);
    Task<IEnumerable<NormalizedInvoice>> GetPendingInvoicesAsync(string customerExternalId, IntegrationSettings settings);
}
```

---

## 3. Configuration & Credentials

Each integration requires a configuration record attached to a Tenant. These secrets are configured dynamically and must **NEVER** be exposed to the frontend.

### Schema Fields
*   **ProviderId** (UUID, FK): Scopes the configuration to a specific B2B Tenant.
*   **ERPType**: Enum (`VOALLE`, `ERPX`, `ERPY`).
*   **EndpointUrl**: Base URL of the ERP API.
*   **Credentials (encrypted in DB)**:
    *   `ClientId`: Public identifier for the integrator user.
    *   `ClientSecret`: Secret key for OAuth/Basic token generation.
    *   `Syndata` (specific to Voalle): Encrypted tenant token/integration token.
    *   `IntegrationKey` / `HeaderToken`: Authentication header configuration.
*   **Settings (JSONB)**: Dynamic key-value pairs (e.g., Timeout, MaxRetryAttempts, CacheDuration).

---

## 4. Multi-Tenant Isolation of Integrations

To enforce strict security constraints:
1.  **Isolation by Tenant**: The integration settings and credentials database tables are protected by PostgreSQL RLS.
2.  **No Cross-Tenant Calls**: A B2B Provider's adapter instance can only fetch credentials matching its own `provider_id`.
3.  **Encrypted Storage**: Credentials are encrypted at rest using AES-256 with keys managed by the Cloud KMS/Secrets Vault.

---

## 5. Integration Life Cycle & Transient Workflows

### 5.1. Real-time Customer Onboarding Flow
```
[Admin Page] ──► [Input CPF/CNPJ] ──► [POST /api/customers/import]
                                                │
                                                ▼
                                    [Backend: Resolve Provider]
                                                │
                                                ▼
                                    [Retrieve ERP Credentials]
                                                │
                                                ▼
                                    [Call ERP Adapter API]
                                                │
                                                ▼
                                    [Normalize Customer JSON]
                                                │
                                                ▼
[Onboarding Confirmed] ◄── [Return Normalized Profile to UI]
```

### 5.2. Delinquency and Access Verification Flow
*   When a B2C Customer logs in or requests a book, the Eligibility Engine executes.
*   It fetches billing data from the ERP (via cached or real-time queries).
*   If delinquent titles are found, the engine evaluates local grace periods before granting/denying access.

---

## 6. Resiliency, Performance, & Error Handling

To ensure external ERP issues do not crash the FIKTA core, adapters must adhere to the following resiliency policies (configured via libraries like Polly in .NET):

*   **Timeout**: Requests to third-party APIs have a strict timeout of **5 seconds**. If the ERP does not respond, the system falls back to cached data.
*   **Retry Policy**: Uses Exponential Backoff with jitter:
    *   Max retries: **3 attempts**.
    *   Base delay: 100ms, 400ms, 1600ms.
    *   Triggers only on transient errors (5xx status, TCP timeouts).
*   **Circuit Breaker**: If the failure rate to a specific ERP exceeds 50% over a 30-second window, the circuit opens for 60 seconds, returning fallback/cached eligibility states automatically.
*   **Rate Limiting**: Voalle API limits integrators to **30 requests per minute**. The backend implements a Token Bucket limiter per Provider context to queue/throttle outgoing API requests.
*   **Caching Strategy**:
    *   Financial status is cached in Redis for **1 hour** to prevent redundant calls during reading sessions.
    *   Product mappings are cached in memory for **24 hours**.
*   **Structured Logs**: Every integration call is logged detailing:
    *   `ProviderId`, `CustomerId`, `ExternalSystem`, `Endpoint`, `HttpStatus`, `LatencyMs`, `Success`.
    *   Request/response payloads are logged only in Debug environments and **MUST** mask sensitive client info.

---

## 7. First Integration: Voalle Adapter

Based on the [Voalle Third-Party API documentation](https://documenter.getpostman.com/view/16282829/TzzBqFw1), here is the mapping structure for the Voalle implementation:

### 7.1. Authentication
*   **Method**: OAuth2 Password/Client Credentials flow to retrieve a bearer `access_token`.
*   **Prerequisite**: The user must be registered in Voalle as a "Usuário integrador" to avoid unauthorized errors.
*   **Payload Required**: `client_id`, `client_secret` (obtained from User configs), and `syndata` (from parameters).

### 7.2. Endpoints Mapped for FIKTA

> For the full API reference with all endpoints, request/response formats, and examples, see [VOALLE-API-REFERENCE.md](./VOALLE-API-REFERENCE.md).

| Core Requirement | Mapped Voalle API Endpoint | Method | Mapped Parameters / Data Fields |
| :--- | :--- | :---: | :--- |
| **Fetch Customer by Doc** | `/external/integrations/thirdparty/people/search?txId={CPF_CNPJ}` | `GET` | `txId` (CPF/CNPJ), returns name, email, phone, address. `typeTxId`: 1=PJ, 2=PF, 3=Estrangeiro. `situation`: 3=Efetivo. |
| **Get Active Contracts** | `/external/integrations/thirdparty/contracts?txId={CPF_CNPJ}&onlyActiveContracts=true` | `GET` | Returns contract IDs, `serviceProductCode`, `contractValue`, `status` (6=Bloqueio Financeiro), `stage`. Paginated. |
| **Financial / Delinquency** | `/external/integrations/thirdparty/financial/invoices?txId={CPF_CNPJ}` | `GET` | Returns open/overdue invoices. Also supports `contractId` param. Includes amount, due date, status. |
| **Financial / Delinquency (Alt)** | `/external/integrations/thirdparty/financial/invoices?contractId={ID}` | `GET` | Same as above but filtered by specific contract. |
| **Settle Invoice** | `/external/integrations/thirdparty/financial/invoices/settle` | `POST` | `transactionId` (GUID), `bankAccountCode`, `paymentFormCode`, `amount`. Always settles fully. |
| **PIX Payment** | `/external/integrations/thirdparty/financial/pix/{titleId}` | `POST` | Requires PIX Voalle parametrization in ERP. |
| **Plan/Service Types** | `/external/integrations/thirdparty/crm/contract-types` | `GET` | Returns contract types and their linked services (plans, speeds, values). |
| **Campaigns & Price Lists** | `/external/integrations/thirdparty/crm/campaigns` | `GET` | Returns campaigns with price lists and product services for plan mapping. |
| **Communication Batch** | `/external/integrations/thirdparty/messaging/batch` | `POST` | 1-100 items/request. Rate limit: 30 req/min. Supports `Idempotency-Key` header. HTTP 207 for partial success. |

> [!NOTE]
> **Authentication**: OAuth2 `client_credentials` → `POST {{URL}}:45700/connect/token` with `grant_type=client_credentials`, `scope=syngw`, `client_id`, `client_secret`, `syndata`. Token expires in 3600s.
> **API Port**: All Third Party endpoints use port `:45715`.
> **Response Pattern**: Always check `success` field in response body, not just HTTP status (can return `200 OK` with `success: false`).
