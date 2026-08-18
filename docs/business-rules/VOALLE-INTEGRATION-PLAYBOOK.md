# 📘 Playbook: Integração ERP Voalle — FIKTA

> **Objetivo**: Orientações completas para implementar a integração backend com o ERP Voalle.
> Este documento serve como briefing/prompt para as próximas sessões de desenvolvimento.

---

## 1. Contexto Geral

O FIKTA é uma plataforma B2B de leitura digital para provedores ISP. 
**Cada provedor (ISP) pode usar um ERP diferente** (Voalle, IXC, SGP, etc.), e cada um terá suas **próprias credenciais** de integração.

### O que a Technet é?
- A **Technet** é **um** provedor ISP cliente do FIKTA.
- As credenciais no `.env` são **exclusivamente da Technet** para desenvolvimento/testes.
- Em produção, cada ISP configura suas credenciais via painel admin → tabela `integration_credentials`.

### Princípio Multi-Tenant
```
FIKTA (plataforma) 
  ├── Provedor A (Technet) → Voalle → credenciais A
  ├── Provedor B (OutroISP) → Voalle → credenciais B (endpoints diferentes!)  
  └── Provedor C (MaisUmISP) → IXC → credenciais C (ERP diferente!)
```

---

## 2. O que USAMOS da API Voalle (Escopo Reduzido)

Dos ~50+ endpoints da API Voalle, **apenas estes são relevantes** para o FIKTA:

### ✅ Endpoints Relevantes

| # | Funcionalidade | Endpoint Third Party | Uso no FIKTA |
|---|---------------|---------------------|-------------------|
| 1 | **Autenticação** | `POST :45700/connect/token` | Obter `access_token` para todas as chamadas |
| 2 | **Buscar Cliente por CPF/CNPJ** | `GET :45715/.../people/search?txId=` | Pesquisar cliente do ISP no cadastro manual |
| 3 | **Listar Contratos (filtrado)** | `GET :45715/.../contracts?txId=&onlyActiveContracts=true` | Ver planos ativos do cliente + valor |
| 4 | **Faturas em Aberto (por CPF)** | `GET :45715/.../financial/invoices?txId=` | Verificar inadimplência |
| 5 | **Faturas em Aberto (por contrato)** | `GET :45715/.../financial/invoices?contractId=` | Detalhar dívida de contrato específico |
| 6 | **Tipos de Contrato e Serviços** | `GET :45715/.../crm/contract-types` | Mapear planos/serviços disponíveis no ISP |
| 7 | **Campanhas e Listas de Preço** | `GET :45715/.../crm/campaigns` | Catálogo de planos com preços |

### ❌ Endpoints que NÃO Usamos

| Endpoint | Motivo |
|----------|--------|
| Conexões / Extrato | Irrelevante — FIKTA não gerencia conexão de internet |
| Service Desk / Solicitações | Fora do escopo — não abrimos protocolos no ERP do ISP |
| ISP / Pontos de Acesso | Irrelevante — infraestrutura de rede |
| CRM / Leads / Negociações | Irrelevante — não vendemos planos de internet |
| Faturamento / NFS-e / NFCom | Irrelevante — não emitimos notas fiscais |
| Mensageria Ativa (Batch) | Não se aplica |
| Pedidos de Venda | Não se aplica |
| Troca de Titularidade | Não se aplica |
| Atualizar Pessoa | Somente leitura — não alteramos dados no ERP |
| Upload/Download de Anexos | Não se aplica |

---

## 3. Fluxos de Negócio a Implementar

### 3.1. 🔍 Fluxo: Cadastro Manual de Cliente via Pesquisa no ERP

**Contexto**: O admin do provedor quer cadastrar um novo cliente no FIKTA. Em vez de digitar tudo na mão, ele pesquisa pelo CPF/CNPJ e puxa os dados do ERP.

```
┌─────────────────────────────────────────────────────────────┐
│                    PAINEL ADMIN                             │
│  Tela: Cadastro de Cliente                                  │
│  [Campo: CPF/CNPJ] [Botão: 🔍 Pesquisar no ERP]           │
└─────────────────────┬───────────────────────────────────────┘
                      │ 1. Click "Pesquisar no ERP"
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                              │
│  POST /api/v1/erp/search-customer                           │
│  Body: { "document": "12345678901", "providerId": "uuid" }  │
└─────────────────────┬───────────────────────────────────────┘
                      │ 2. Resolve credenciais do provider
                      │ 3. Autentica no Voalle (se token expirado)
                      │ 4. GET /people/search?txId=12345678901
                      │ 5. GET /contracts?txId=...&onlyActiveContracts=true
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESPONSE                                 │
│  {                                                          │
│    "found": true,                                           │
│    "customer": {                                            │
│      "name": "João Silva",                                  │
│      "document": "123.456.789-01",                          │
│      "email": "joao@email.com",                             │
│      "phone": "34999999999"                                 │
│    },                                                       │
│    "activeContracts": [                                     │
│      {                                                      │
│        "contractNumber": 1234,                              │
│        "planName": "Internet 200MB",                        │
│        "value": 99.90,                                      │
│        "status": "Normal",                                  │
│        "stage": "Aprovado"                                  │
│      }                                                      │
│    ]                                                        │
│  }                                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ 6. Admin visualiza dados
                      │ 7. Confirma importação
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Salva no banco local FIKTA:                           │
│  - Tabela `customers` (dados básicos)                       │
│  - Vincula `external_product_mapping` (plano → catálogo)    │
│  - Cliente pronto para acessar a plataforma                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.2. 🚨 Fluxo: Verificação de Inadimplência (Eligibility)

**Contexto**: Quando o cliente B2C acessa o FIKTA, o sistema verifica se ele está em dia com o ISP.

```
┌─────────────────────────────────────────────────────────────┐
│  Cliente tenta acessar catálogo ou ler livro                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Eligibility Engine verifica:                                │
│  1. Provider está ativo? → Se não, BLOQUEIA                │
│  2. Cliente está ativo localmente? → Se não, BLOQUEIA       │
│  3. Cliente tem contrato ativo no ERP?                       │
│     → GET /contracts?txId={cpf}&onlyActiveContracts=true    │
│     → Se contrato com status=6 (Bloqueio Fin.) → BLOQUEIA  │
│  4. Cliente tem faturas vencidas?                            │
│     → GET /financial/invoices?txId={cpf}                    │
│     → Filtra faturas com vencimento < hoje                  │
│     → Aplica regras do provider:                            │
│       - GracePeriodDays (tolerância em dias)                │
│       - MaxOverdueTitles (max boletos atrasados)            │
│     → Se breached → BLOQUEIA                                │
│  5. Plano do contrato mapeia para catálogo?                  │
│     → Consulta external_product_mappings                    │
│     → Se sem mapeamento → BLOQUEIA                          │
│  6. LIBERA acesso ao catálogo correspondente                │
└─────────────────────────────────────────────────────────────┘
```

### 3.3. 📋 Fluxo: Listar Catálogo de Planos do ISP

**Contexto**: O admin FIKTA configura os mapeamentos de plano → catálogo de livros. Precisa ver quais planos o ISP tem disponível.

```
┌─────────────────────────────────────────────────────────────┐
│  Admin abre tela "Mapeamento de Planos"                     │
│  Sistema carrega tipos de contrato do ERP:                  │
│  → GET /crm/contract-types                                  │
│  → GET /crm/campaigns (com listas de preço)                 │
│                                                              │
│  Exibe lista:                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Plano ERP         │ Valor   │ Catálogo FIKTA (mapear)  │   │
│  │ Internet 100MB    │ R$59,90 │ [Selecionar...]        │   │
│  │ Internet 200MB    │ R$99,90 │ [Premium]              │   │
│  │ Combo 300MB+TV    │ R$149,90│ [Gold]                 │   │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Admin mapeia cada plano para um catálogo FIKTA         │
│  → Salva em `external_product_mappings`                     │
│  → Salva em `catalog_access_rules`                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Modelo de Dados para Integração (já existe no DATABASE.md)

### Tabelas envolvidas:

```sql
-- Cada ISP tem seu próprio registro de integração
integrations (
  provider_id → providers.id,
  external_system_id → external_systems.id,  -- ex: "Voalle"
  endpoint_url,  -- ex: "https://erp.provedortechnet.com.br"
  status  -- ACTIVE/INACTIVE
)

-- Credenciais encriptadas (NUNCA em texto plano)
integration_credentials (
  integration_id → integrations.id,
  encrypted_client_id,      -- ex: "<client_id do integrador>"
  encrypted_client_secret,  -- ex: "<hash do client_secret>"
  encrypted_syndata,        -- Token Voalle específico
  encrypted_additional_secrets  -- JSONB para campos extras
)

-- Mapeamento: plano do ERP → produto interno FIKTA
external_product_mappings (
  integration_id → integrations.id,
  external_product_id,    -- código do plano no Voalle
  internal_product_code   -- tag interna (ex: "une_books_premium")
)

-- Regra: produto interno → acesso a catálogo
catalog_access_rules (
  provider_id,
  internal_product_code,  -- "une_books_premium"
  collection_id,          -- acesso a qual coleção de livros
  category_id             -- ou a qual categoria
)
```

---

## 5. Endpoints Backend FIKTA a Criar

### API interna (backend C# .NET):

| Método | Rota | Descrição | Quem usa |
|--------|------|-----------|----------|
| `POST` | `/api/v1/erp/authenticate` | Força re-autenticação com o ERP (admin debug) | Admin |
| `POST` | `/api/v1/erp/search-customer` | Pesquisa cliente por CPF/CNPJ no ERP | Admin (cadastro) |
| `GET` | `/api/v1/erp/contracts/{document}` | Lista contratos ativos de um CPF/CNPJ | Admin + Engine |
| `GET` | `/api/v1/erp/invoices/{document}` | Lista faturas em aberto (inadimplência) | Admin + Engine |
| `GET` | `/api/v1/erp/plans` | Lista planos/serviços disponíveis no ERP do ISP | Admin (mapeamento) |
| `POST` | `/api/v1/customers/import` | Importa cliente do ERP para o banco local | Admin |
| `GET` | `/api/v1/customers/{id}/eligibility` | Verifica elegibilidade em tempo real | Engine (automático) |
| `GET` | `/api/v1/provider/plan-mappings` | Lista mapeamentos plano↔catálogo | Admin |
| `POST` | `/api/v1/provider/plan-mappings` | Cria/atualiza mapeamento plano↔catálogo | Admin |

---

## 6. Regras de Autenticação com o Voalle (Token Management)

```csharp
// Pseudocódigo do gerenciador de tokens
class VoalleTokenManager {
    // Cache de tokens por provider (cada ISP tem o seu)
    Dictionary<Guid, CachedToken> _tokens;
    
    async Task<string> GetTokenAsync(Guid providerId) {
        if (_tokens.TryGet(providerId, out var cached) && !cached.IsExpired)
            return cached.AccessToken;
        
        var creds = await _db.GetCredentials(providerId); // decrypt
        var token = await HttpPost(
            $"{creds.EndpointUrl}:45700/connect/token",
            form: {
                grant_type: "client_credentials",
                scope: "syngw",
                client_id: creds.ClientId,
                client_secret: creds.ClientSecret,
                syndata: creds.SynData
            }
        );
        
        _tokens[providerId] = new CachedToken(token, expiresIn: 3600);
        return token.access_token;
    }
}
```

---

## 7. Tratamento de Respostas Voalle

> [!WARNING]
> O Voalle pode retornar **HTTP 200 com `success: false`** no body.
> Sempre valide o campo `success` no JSON, nunca confie apenas no status HTTP.

```csharp
// Padrão de resposta Voalle
class VoalleResponse<T> {
    bool Success { get; set; }
    T Data { get; set; }
    List<VoalleMessage> Messages { get; set; }
    decimal ElapsedTime { get; set; }
}

class VoalleMessage {
    string Message { get; set; }
    int Code { get; set; }
    string Type { get; set; } // "Success", "Warn", "Error"
}
```

---

## 8. Checklist de Implementação

### Fase 1: Infraestrutura
- [ ] Criar `VoalleApiClient` (HttpClient configurado com retry, timeout, circuit breaker)
- [ ] Criar `VoalleTokenManager` (cache de tokens por provider)
- [ ] Implementar `IExternalCustomerProvider` para Voalle
- [ ] Implementar `IExternalFinancialProvider` para Voalle
- [ ] Implementar `IExternalProductProvider` para Voalle

### Fase 2: Endpoints Backend
- [ ] `POST /api/v1/erp/search-customer` — busca por CPF/CNPJ
- [ ] `GET /api/v1/erp/contracts/{doc}` — lista contratos ativos
- [ ] `GET /api/v1/erp/invoices/{doc}` — lista faturas em aberto
- [ ] `GET /api/v1/erp/plans` — lista tipos de contrato e serviços
- [ ] `POST /api/v1/customers/import` — importar cliente do ERP para local

### Fase 3: Frontend Admin
- [ ] Tela de cadastro de cliente com botão "🔍 Pesquisar no ERP"
- [ ] Modal com resultado da pesquisa (dados + contratos + botão importar)
- [ ] Tela de mapeamento de planos (plano ERP ↔ catálogo FIKTA)
- [ ] Dashboard de inadimplência (clientes com faturas vencidas)

### Fase 4: Eligibility Engine
- [ ] Integrar verificação de contrato ativo no fluxo de login B2C
- [ ] Integrar verificação de faturas vencidas
- [ ] Aplicar grace period e max overdue rules
- [ ] Cache de status financeiro (Redis, 1h TTL)

### Fase 5: Configuração por Provider
- [ ] Tela admin para configurar credenciais de integração ERP
- [ ] Tela admin para selecionar tipo de ERP (Voalle, IXC, etc.)
- [ ] Tela admin para configurar regras de inadimplência (grace period, max títulos)

---

## 9. Referências

| Documento | Path |
|-----------|------|
| API Reference Completa Voalle | [VOALLE-API-REFERENCE.md](../architecture/VOALLE-API-REFERENCE.md) |
| Arquitetura de Integração | [INTEGRATIONS.md](../architecture/INTEGRATIONS.md) |
| Eligibility Engine | [ELIGIBILITY.md](../architecture/ELIGIBILITY.md) |
| Multi-Tenancy | [MULTI-TENANCY.md](../architecture/MULTI-TENANCY.md) |
| Database Schema | [DATABASE.md](../database/DATABASE.md) |
| Credenciais (dev/Technet) | [.env](../../.env) |
