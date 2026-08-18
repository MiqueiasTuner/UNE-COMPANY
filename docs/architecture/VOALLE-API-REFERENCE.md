# ERP Voalle - API Third Party — **BACKUP / FALLBACK**


> [!IMPORTANT]
> **Esta NÃO é mais a API principal.** A integração oficial da FIKTA passou a ser a **Portal V2 (App Cliente)**, documentada em [VOALLE-PORTAL-V2-API.md](./VOALLE-PORTAL-V2-API.md) e homologada para a UNE TELECOM.
>
> Este documento permanece como **backup**: serve para provedores que não exponham o App Cliente e como referência dos endpoints administrativos que a Portal V2 não cobre (criar pessoa, pedidos de venda, faturamento fiscal, mensageria).
Este documento detalha **todas as APIs do ERP Voalle** utilizadas no projeto FIKTA para integração com provedores ISP. São **duas APIs distintas** com propósitos diferentes.

> [!IMPORTANT]
> Este ERP (Voalle) é o sistema de gestão utilizado pelos provedores de internet (ISPs) parceiros. A FIKTA integra com ele para buscar dados de clientes, verificar inadimplência e mapear planos contratados.

### Status de verificação dos endpoints

Nem todo endpoint deste documento foi conferido contra a collection oficial do Postman da Voalle. Os que **foram** estão marcados com ✅ e trazem exemplo de response real:

Legenda: 🟢 **testado contra o ERP real da TechNet** (2026-08-18) · ✅ conferido na collection oficial · ⚠️ não verificado

| Endpoint | Status |
|----------|:------:|
| `POST /connect/token` (client_credentials) | 🟢 |
| `GET /people/txid/{txId}` | 🟢 |
| `GET /getopentitlesbytxid/{txId}` | 🟢 |
| `GET /gettitlesbytxid/{txId}` | 🟢 |
| `GET /crm/contracttypesandservices` | 🟢 |
| `POST /connect/token` (refresh_token) | ✅ |
| `GET /getcontractbillets/{contractId}` | ✅ |
| `GET /GetBillet/{id}` e `GET /GetBilletLink/{id}` | ✅ |
| **Contratos** (`/contracts`, qualquer variação) | ❌ **404 no ERP real** |
| Demais (service desk, ISP, fiscal, Portal V2) | ⚠️ não verificado |

> [!CAUTION]
> **O módulo de Contratos (§2.4) não existe neste path.** Testado com token válido contra o ERP da TechNet: `/contracts`, `/contracts?personId=`, `/contracts?txId=`, `/getcontracts` e `/getcontractsbytxid/{txId}` retornam **404**. O mesmo vale para `/crm/campaigns`.
> Consequência prática: `GetCustomerContractsAsync` sempre devolve lista vazia, e por tabela o mapeamento de plano por `serviceProductCode` fica sem fonte. Antes de implementar qualquer coisa que dependa de contrato, é preciso descobrir o path correto com a Voalle — ou obter os contratos pela **Portal V2** (`/api/people/{id}/contracts`), que documenta esse recurso explicitamente.

> [!CAUTION]
> Os endpoints marcados ⚠️ foram escritos por inferência e **podem ter path ou formato errados**. Uma revisão anterior deste documento continha caminhos inventados (`people/search?txId=`, `financial/invoices?txId=`, `crm/contract-types`) que não existem na API — o mesmo erro foi replicado no `VoalleAdapter.cs`. Antes de implementar qualquer endpoint ⚠️, confira na collection oficial e promova para ✅.

---

## 1. Visão Geral das Duas APIs

| API | Propósito | Documentação | Auth |
|-----|-----------|-------------|------|
| **Portal V2** | API do portal do cliente final (assinante) | [Postman](https://documenter.getpostman.com/view/16282829/UUxwD9Yq) | Token próprio via login |
| **Third Party (Terceiros)** | API de integração para sistemas externos | [Postman](https://documenter.getpostman.com/view/16282829/TzzBqFw1) | OAuth2 `client_credentials` |

### Quando usar cada uma?

- **Third Party**: É a **principal** para nosso caso. Permite buscar clientes por CPF/CNPJ, listar contratos, verificar títulos em aberto (inadimplência), e consultar planos. É a API de **backend-to-backend**.
- **Portal V2**: É a API do portal do cliente. Pode ser útil para obter dados complementares como boletos PDF, extrato de conexões, e notas fiscais. Requer login como se fosse o próprio cliente.

---

## 2. API Third Party (Integração Terceiros) — PRINCIPAL

### 2.1. Servidor e Portas

| Componente | URL |
|-----------|-----|
| **Servidor** | `https://erp.provedortechnet.com.br` |
| **Auth (Token)** | Porta `:45700` → `/connect/token` |
| **API (Endpoints)** | Porta `:45715` → `/external/integrations/thirdparty/...` |

### 2.2. Autenticação — OAuth2 Client Credentials

```http
POST {{URL}}:45700/connect/token
Content-Type: application/x-www-form-urlencoded
```

**Body (form-urlencoded):**

| Campo | Valor | Descrição |
|-------|-------|-----------|
| `grant_type` | `client_credentials` | Valor fixo |
| `scope` | `syngw` | Valor fixo |
| `client_id` | `<client_id do integrador>` | Usuário integrador (CNPJ) |
| `client_secret` | `<client_secret — ver user-secrets>` | Senha hash do integrador |
| `syndata` | `<syndata — ver user-secrets>...` | Token criptografado do tenant |

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "syngw"
}
```

> [!NOTE]
> O `access_token` deve ser enviado em todas as requisições subsequentes no header `Authorization: Bearer {access_token}`.
> O token expira em **1 hora** (3600s). Implementar refresh automático.

A resposta real também traz `refresh_token`, usado na seção seguinte:

```json
{
  "access_token": "xxxxxxxx",
  "expires_in": 3600,
  "refresh_token": "xxxxxxxx",
  "token_type": "Bearer"
}
```

> [!TIP]
> **Homologação/Staging:** usar `client_id`, `client_secret` e `syndata` do ambiente de staging, porém apontar a requisição **de autenticação** para a URL do ambiente de **produção**. É uma particularidade da Voalle — o restante das chamadas vai normalmente para o host de staging.

#### 2.2.1. Refresh Token

```http
POST {{URL}}:45700/connect/token
Content-Type: application/x-www-form-urlencoded
```

| Campo | Valor | Descrição |
|-------|-------|-----------|
| `grant_type` | `refresh_token` | Valor fixo |
| `client_id` | `synauth` | **Valor fixo** — não é o client_id do integrador |
| `client_secret` | `df956154024a425eb80f1a2fc12fef0c` | **Valor fixo público** da Voalle |
| `refresh_token` | `xxxxxxxx` | Obtido no método de autenticação |

```bash
curl --location 'https://erp.cliente.com.br:45700/connect/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=refresh_token' \
  --data-urlencode 'client_id=synauth' \
  --data-urlencode 'client_secret=df956154024a425eb80f1a2fc12fef0c' \
  --data-urlencode 'refresh_token=xxxxxxxx'
```

> [!IMPORTANT]
> No refresh o `client_id`/`client_secret` são **constantes da Voalle** (`synauth`), iguais para todos os tenants — não são segredo do provedor e não devem ser guardados em `IntegrationCredential`. O que é secreto é o `refresh_token`.
> A resposta devolve um **novo** `refresh_token`; é rotativo, então é preciso persistir o valor novo a cada uso.

> [!NOTE]
> Para integração backend-to-backend o refresh é **opcional**: reautenticar com `client_credentials` custa a mesma chamada e é mais simples que gerenciar rotação. Ver a estratégia de cache de token em [§7](#7-estratégia-de-cache-e-persistência).

### 2.3. Módulo: Pessoas (Clientes)

#### 2.3.1. Criar Pessoa
```http
POST {{URL}}:45715/external/integrations/thirdparty/people
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Nome do Cliente",
  "fantasyName": "Nome Fantasia",
  "txId": "12345678901",
  "typeTxId": 2,
  "situation": 3,
  "email": "email@cliente.com",
  "phone": "34999999999"
}
```

**Campos `typeTxId`:**
| Valor | Tipo |
|-------|------|
| 1 | Pessoa Jurídica (CNPJ) |
| 2 | Pessoa Física (CPF) |
| 3 | Estrangeiro |

**Campos `situation`:**
| Valor | Status |
|-------|--------|
| 1 | Contato |
| 3 | Efetivo |
| 4 | Lead |

#### 2.3.2. Buscar Pessoa por CPF/CNPJ ⭐
```http
GET {{URL}}:45715/external/integrations/thirdparty/people/txid/{{txId}}
Authorization: Bearer {{access_token}}
```

> [!TIP]
> **Este é o endpoint principal para nosso fluxo de cadastro de clientes.**
> São retornados apenas registros com atributo "cliente" marcado no ERP.

> [!IMPORTANT]
> O documento vai **no path**, não em query string. Enviar apenas dígitos (sem ponto, barra ou traço).

**Response (200):**
```json
{
  "success": true,
  "messages": null,
  "response": {
    "id": 123456,
    "name": "Nome do Cliente",
    "name2": "",
    "txId": "00000000000",
    "email": "cliente@exemplo.com.br",
    "status": 1,
    "phone": "(55) 3220-1350",
    "birthDate": "2021-07-07",
    "cellPhone": "(55) 3220-1350",
    "mainAddress": {
      "streetType": "Rua",
      "street": "Rua das Laranjeiras",
      "number": "123",
      "addressComplement": "ap 01",
      "neighborhood": "Centro",
      "city": "Santa Maria",
      "codeCityId": 4316907,
      "addressReference": "Portão verde",
      "state": "RS",
      "postalCode": "00000-000",
      "longitude": "00.0000",
      "latitude": "00.0000"
    },
    "titles": [
      {
        "id": 123456,
        "billet": {
          "bankTitleNumber": null,
          "balance": 0.00,
          "title": "FAT00000000000000",
          "issueDate": "2019-07-19",
          "expirationDate": "2019-08-15",
          "processingDate": "2021-07-07",
          "amount": { "value": 0.00, "finalValue": 0.00, "discount": 0, "fine": 0, "interest": 0 }
        }
      }
    ]
  },
  "dataResponseType": "List<Int64>",
  "elapsedTime": null
}
```

> [!NOTE]
> `birthDate` retorna a data de nascimento quando o documento é **CPF** e `null` quando é **CNPJ** — serve como heurística de pessoa física/jurídica.
> Aqui `response` é um **objeto único**, não um array (diferente dos endpoints financeiros).

#### 2.3.3. Listar Clientes (Paginado)
```http
GET {{URL}}:45715/external/integrations/thirdparty/people?page=1&pageSize=25
Authorization: Bearer {{access_token}}
```

**Parâmetros de Query:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `page` | int | ✅ | Número da página |
| `pageSize` | int | ✅ | Itens por página |
| `filter` | string | ❌ | Filtros opcionais |
| `sort` | string | ❌ | Ordenação opcional |

#### 2.3.4. Atualizar Pessoa (Email/Telefone)
```http
PUT {{URL}}:45715/external/integrations/thirdparty/people/{id}
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "id": 123,
  "email": "novo@email.com",
  "phone": "34999999999"
}
```

#### 2.3.5. Atualizar/Adicionar Endereço
```http
PUT {{URL}}:45715/external/integrations/thirdparty/people/{id}/address
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

#### 2.3.6. Criar/Vincular Contatos
```http
POST {{URL}}:45715/external/integrations/thirdparty/people/{id}/contacts
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

### 2.4. Módulo: Contratos ⭐

#### 2.4.1. Listar Contratos (Paginado com Filtros)
```http
GET {{URL}}:45715/external/integrations/thirdparty/contracts?page=1&pageSize=25
Authorization: Bearer {{access_token}}
```

**Parâmetros de Query:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `page` | int | Condicional | Obrigatório sem `txId` ou `contractNumber` |
| `pageSize` | int | Condicional | Valores: 5, 10, 20, 25, 50, 100 |
| `txId` | string | ❌ | Filtrar por CPF/CNPJ do cliente |
| `contractNumber` | int | ❌ | Filtrar por número do contrato |
| `onlyActiveContracts` | bool | ❌ | Apenas contratos ativos |
| `serviceProductCode` | string | ❌ | Filtrar por serviço específico |
| `contractTypeCode` | string | ❌ | Filtrar por tipo de contrato |
| `companyPlaceTxId` | string | ❌ | Filtrar por local |
| `txIdType` | int | ❌ | Filtrar por tipo de cliente |

> [!TIP]
> **Para buscar contratos de um cliente específico**, use `txId` com o CPF/CNPJ + `onlyActiveContracts=true`. Isso retorna o plano contratado, valor e status.

**Status do Contrato (`v_status`):**
| Valor | Status |
|-------|--------|
| 1 | Normal |
| 2 | Demonstração |
| 3 | Cortesia |
| 4 | Cancelado |
| 5 | Suspenso |
| 6 | **Bloqueio Financeiro** ⚠️ |
| 7 | Bloqueio Administrativo |
| 9 | Encerrado |

**Estágio do Contrato (`stage`):**
| Valor | Estágio |
|-------|---------|
| 1 | Pré-contrato |
| 2 | Em aprovação |
| 3 | Aprovado |
| 4 | Rejeitado |
| 5 | Cancelado |

#### 2.4.2. Aprovar Contrato
```http
PUT {{URL}}:45715/external/integrations/thirdparty/contracts/approve/{contractId}
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

#### 2.4.3. Troca de Titularidade
```http
PUT {{URL}}:45715/external/integrations/thirdparty/contracts/{contractid}/change-ownership/{clientid}
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

### 2.5. Módulo: Financeiro (Inadimplência) ⭐⭐⭐

> [!IMPORTANT]
> **Este módulo é CRÍTICO para o FIKTA.** É através dele que verificamos se o cliente está inadimplente para bloquear/liberar acesso à plataforma de leitura.

#### 2.5.1. Buscar Faturas em Aberto por CPF/CNPJ ⭐
```http
GET {{URL}}:45715/external/integrations/thirdparty/getopentitlesbytxid/{{txId}}
Authorization: Bearer {{access_token}}
```

> São listadas faturas **em aberto** e **em atraso**, ou com vencimento para o próximo mês da consulta.

**Response (200):**
```json
{
  "success": true,
  "messages": null,
  "response": [
    {
      "id": 123456,
      "billet": {
        "bankTitleNumber": null,
        "barcode": null,
        "typefulLine": "00000.00000 00000.000000 00000.00000 0 000000000000",
        "pixQRCode": "0123456br.gov.bcb.pix2563qrcodepix.bb.com.br/pix/v2/...",
        "title": "FAT000000000000000",
        "issueDate": "2018-07-30",
        "expirationDate": "2018-08-20",
        "processingDate": "2021-07-07",
        "amount": { "value": 0, "finalValue": 0, "discount": 0, "fine": 0, "interest": 0 }
      },
      "client": {
        "txId": "0000000000000",
        "name": "Nome do Cliente",
        "address": { "street": "...", "number": "1234", "codeCityId": 123456, "city": "...", "state": "RS", "postalCode": "00000-000", "addressComplement": "" }
      },
      "companyPlace": { "txId": "123456", "name": "...", "address": { "street": "...", "number": "123456", "city": "...", "state": "RS", "postalCode": "00000-000" } },
      "bank": {
        "code": "001",
        "name": "Banco do Brasil S.A.",
        "agency": { "number": "0000", "digit": "0" },
        "account": { "number": "000000", "digit": "0" },
        "bankUse": ""
      },
      "collectionType": { "specieTitle": "DMI", "loanPortfolio": "17", "quantity": "", "accept": "N" }
    }
  ],
  "dataResponseType": "List<Int64>",
  "elapsedTime": null
}
```

> [!WARNING]
> **Não existe campo `status` neste endpoint** — por definição tudo que ele retorna está em aberto. Para saber se a fatura está **vencida**, compare `billet.expirationDate` com a data de hoje.
> O valor a cobrar é `billet.amount.finalValue` (já com multa, juros e desconto aplicados), **não** `billet.amount.value`.

#### 2.5.2. Buscar TODAS as Faturas por CPF/CNPJ ⭐
```http
GET {{URL}}:45715/external/integrations/thirdparty/gettitlesbytxid/{{txId}}
Authorization: Bearer {{access_token}}
```

Retorna o histórico completo (pagas, canceladas, vencidas e em aberto). Campos que **só existem aqui**, comparado ao `getopentitlesbytxid`:

| Campo | Descrição |
|-------|-----------|
| `billet.status` | `Em aberto`, `Paga`, `Cancelada` ou `Vencida` |
| `billet.amount.originalValue` | Valor antes de ajustes |
| `billet.receipts` | Dados do recebimento, quando a fatura foi paga |

```json
{
  "success": true,
  "messages": null,
  "response": [
    {
      "id": 123456,
      "billet": {
        "typefulLine": "00000.00000 00000.000000 00000.00000 0 000000000000",
        "pixQRCode": "...",
        "title": "FAT000000000000000",
        "issueDate": "2018-07-30",
        "expirationDate": "2018-08-20",
        "processingDate": "2021-07-07",
        "status": "Em aberto",
        "amount": { "value": 0.00, "finalValue": 0.00, "discount": 0.00, "fine": 0.00, "interest": 0.00, "originalValue": 0.00 },
        "receipts": {
          "ammount": 0.00,
          "discount": 0.00,
          "fine": 0.00,
          "interest": 0.00,
          "receiptDate": "2026-07-07"
        }
      },
      "client": { "txId": "0000000000000", "name": "...", "address": { "...": "..." } },
      "companyPlace": { "...": "..." },
      "bank": { "...": "..." },
      "collectionType": { "...": "..." }
    }
  ],
  "dataResponseType": "List<Int64>",
  "elapsedTime": null
}
```

> [!CAUTION]
> O campo de total recebido é `receipts.ammount` — com **dois "m"**. É um typo da própria API Voalle; manter exatamente assim no mapeamento.

#### 2.5.3. Buscar Faturas em Aberto por Contrato
```http
GET {{URL}}:45715/external/integrations/thirdparty/getcontractbillets/{{contractId}}
Authorization: Bearer {{access_token}}
```

Formato de resposta **diferente** dos anteriores — mais enxuto e já traz o `link` do boleto pronto:

```json
{
  "success": true,
  "messages": null,
  "response": [
    {
      "id": 123123,
      "title": "FAT123456789",
      "expirationDate": "2021-05-30T00:00:00",
      "parcel": 1,
      "typefulLine": "00000.00000 00000.000000 00000.000000 0 00000000000000",
      "link": "https://d03.synsuite.com.br/financial_receivable_titles/boletos/a1b2c3d4e5",
      "pixQRCode": "0123456br.gov.bcb.pix2563qrcodepix.bb.com.br/pix/v2/..."
    }
  ],
  "dataResponseType": "List<ThirdPartyIntegrationService+TitleBillet>",
  "elapsedTime": null
}
```

> [!NOTE]
> Aqui os campos são **planos** (`title` e `expirationDate` na raiz), enquanto nos endpoints por `txId` eles ficam aninhados dentro de `billet`. O `pixQRCode` pode vir como string vazia.

#### 2.5.4. Baixar PDF do Boleto
```http
GET {{URL}}:45715/external/integrations/thirdparty/GetBillet/{{id_fatura}}
Authorization: Bearer {{access_token}}
```

Retorna o **arquivo PDF binário** do boleto já impresso, conforme o layout definido no ERP no cadastro de tipo de cobrança. Não é JSON — tratar como `application/pdf`.

O `{{id_fatura}}` é o campo `id` retornado pelos endpoints de faturas.

#### 2.5.5. Obter LINK do Boleto ⭐
```http
GET {{URL}}:45715/external/integrations/thirdparty/GetBilletLink/{{id_fatura}}
Authorization: Bearer {{access_token}}
```

```json
{
  "success": true,
  "messages": null,
  "response": {
    "link": "https://portal.xxxxx.com.br/financial_receivable_titles/check_bank/d1d2f330f6ffc2d2711d1125716ffe2d?validationCode=81kBAAAAAAA="
  }
}
```

> [!TIP]
> **Prefira este ao PDF no portal B2C.** Devolver um link é muito mais barato do que trafegar e armazenar o PDF, e o link já vem assinado (`validationCode`) — pode ir direto para o navegador do cliente final.

#### 2.5.6. Liquidar Fatura (Pagamento)
```http
POST {{URL}}:45715/external/integrations/thirdparty/financial/invoices/settle   # ⚠️ path não verificado
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "transactionId": "418b6d6c-6352-4bae-ab37-e70e959c25f5",
  "bankAccountCode": "CODIGO_CONTA",
  "paymentFormCode": "CODIGO_FORMA_PAGAMENTO",
  "amount": 99.90
}
```

> A liquidação é sempre **total**. Se valor menor → desconto. Se valor maior → acréscimo.

#### 2.5.7. Registrar Pix por ID de Título
```http
POST {{URL}}:45715/external/integrations/thirdparty/financial/pix/{titleId}
Authorization: Bearer {{access_token}}
```

> Requer parametrização do PIX Voalle no cadastro de Locais do ERP.

#### 2.5.8. Criar Valor Eventual (Acréscimo/Desconto)
```http
POST {{URL}}:45715/external/integrations/thirdparty/contracts/eventual-values
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

### 2.6. Módulo: Pedidos de Venda

#### 2.6.1. Gerar Pedido de Venda
```http
POST {{URL}}:45715/external/integrations/thirdparty/sales-orders
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

### 2.7. Módulo: Service Desk (Solicitações/Protocolos)

#### 2.7.1. Buscar Solicitação
```http
GET {{URL}}:45715/external/integrations/thirdparty/projects/solicitation?assignmentId={{ID}}&protocol={{NUMBER}}
Authorization: Bearer {{access_token}}
```

#### 2.7.2. Listar Relatos de Solicitação
```http
GET {{URL}}:45715/external/integrations/thirdparty/projects/solicitation/{id}/reports
Authorization: Bearer {{access_token}}
```

#### 2.7.3. Listar Solicitações de Cliente
```http
GET {{URL}}:45715/external/integrations/thirdparty/projects/solicitation/client/{txId}?allAssignments=false
Authorization: Bearer {{access_token}}
```

#### 2.7.4. Tipos de Solicitação (Paginado)
```http
GET {{URL}}:45715/external/integrations/thirdparty/projects/solicitation-types?page=1&pageSize=25
Authorization: Bearer {{access_token}}
```

#### 2.7.5. Abertura de Solicitação Externa (Detalhada)
```http
POST {{URL}}:45715/external/integrations/thirdparty/projects/solicitation
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body (campos principais):**
```json
{
  "clientId": 123,
  "personId": 123,
  "incidentTypeId": 1,
  "incidentStatusId": 1,
  "contractServiceTagId": 456,
  "catalogServiceId": 789,
  "serviceLevelAgreementId": 10,
  "assignment": {
    "beginningDate": "2024-01-15 10:00:00.0",
    "title": "Título da solicitação",
    "description": "Descrição detalhada"
  },
  "report": {}
}
```

#### 2.7.6. Relato + Alteração de Status
```http
POST {{URL}}:45715/external/integrations/thirdparty/projects/solicitation/report
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Status de Solicitação (`incidentStatusId`):**
| Valor | Status |
|-------|--------|
| 1 | Abertura |
| 2 | Andamento |
| 3 | Fechamento |
| 4 | Encerramento |
| 8 | Cancelado |
| 9 | Ag. Classificação |

### 2.8. Módulo: Etiquetas de Serviço

#### 2.8.1. Listar Etiquetas de Contrato
```http
GET {{URL}}:45715/external/integrations/thirdparty/contract-service-tags?txId={{CPF_CNPJ}}&page=1&pageSize=25
Authorization: Bearer {{access_token}}
```

#### 2.8.2. Listar Catálogo de Serviços
```http
GET {{URL}}:45715/external/integrations/thirdparty/service-catalogs/{serviceTagId}?page=1&pageSize=25
Authorization: Bearer {{access_token}}
```

### 2.9. Módulo: CRM (Vendas/Negociações)

#### 2.9.1. Criar Lead
```http
POST {{URL}}:45715/external/integrations/thirdparty/crm/leads
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

#### 2.9.2. Gerar Negociação (Venda)
```http
POST {{URL}}:45715/external/integrations/thirdparty/crm/negotiations
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

#### 2.9.3. Consultar Campanhas e Serviços
```http
GET {{URL}}:45715/external/integrations/thirdparty/crm/campaigns
Authorization: Bearer {{access_token}}
```

#### 2.9.4. Consultar Tipos de Contrato e Serviços ⭐⭐⭐
```http
GET {{URL}}:45715/external/integrations/thirdparty/crm/contracttypesandservices
Authorization: Bearer {{access_token}}
accept: application/json
```

> [!IMPORTANT]
> **Este é o endpoint que amarra o catálogo FIKTA ao ERP do provedor.** O `code` de cada serviço (ex.: `1.3`) é a chave estável usada em `ExternalProductMapping` para decidir quais livros o assinante daquele plano enxerga.

**Pré-requisitos no ERP** (o provedor precisa configurar, senão o retorno vem vazio):

1. Em *Service Desk / Cadastros / Contratos - Tipos*, selecionar o tipo de contrato desejado ou cadastrar um novo.
2. No menu **Parâmetros** desse tipo de contrato, habilitar a opção **Integração** — só assim o tipo e seus serviços vinculados são expostos para uso fora do ERP.

**Para o serviço ser válido para start de venda:**

- Estar vinculado ao tipo de contrato informado
- **Não** ser de telefonia fixa, telefonia móvel ou recarga
- Sendo combo, nenhum dos filhos pode ser telefonia fixa, móvel ou recarga
- Haver pelo menos um serviço **mensal** entre eles

**Response (200):**
```json
{
  "success": true,
  "messages": "",
  "response": [
    {
      "code": "1",
      "title": "PF - Composto",
      "description": "",
      "collectionDays": [5, 10, 15],
      "contractTypesServiceProduct": [
        { "code": "1.1", "title": "Serviço de Configuração de Roteador", "description": null },
        { "code": "1.2", "title": "Serviço de Instalação", "description": "" },
        { "code": "1.3", "title": "Fibra 300 Mb", "description": null }
      ]
    },
    {
      "code": "2",
      "title": "PF - Composto - Carnê",
      "description": "",
      "collectionDays": [13, 18, 5],
      "contractTypesServiceProduct": [
        { "code": "2.1", "title": "Assistência", "description": "" }
      ]
    }
  ],
  "dataResponseType": null,
  "elapsedTime": null
}
```

> [!CAUTION]
> O `code` do serviço segue o padrão `{codigo_do_tipo}.{sequencial}`. Ele é estável dentro de um tenant, mas **não é global** — o `code` `1.3` da UNE TELECOM não é o mesmo serviço que o `1.3` da TechNet. Sempre chavear por `(provider_id, external_code)`.
> `collectionDays` traz os dias de vencimento permitidos para aquele tipo de contrato.
> Note que aqui `messages` vem como string vazia `""`, e não `null` como nos demais endpoints — não assumir um tipo fixo ao desserializar.

### 2.10. Módulo: ISP/Telecom

#### 2.10.1. Atualizar Conexão
```http
PUT {{URL}}:45715/external/integrations/thirdparty/isp/authentication_contracts/{id}
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

#### 2.10.2. Buscar Status de Ponto de Acesso (por Contrato)
```http
GET {{URL}}:45715/external/integrations/thirdparty/isp/access-points/contract/{contractId}
Authorization: Bearer {{access_token}}
```

#### 2.10.3. Buscar Status de Pontos de Acesso (por Pessoa)
```http
GET {{URL}}:45715/external/integrations/thirdparty/isp/access-points/person/{personId}
Authorization: Bearer {{access_token}}
```

#### 2.10.4. Registrar Tráfego de Dados
```http
POST {{URL}}:45715/external/integrations/thirdparty/isp/authentication_contracts/traffic
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

### 2.11. Módulo: Faturamento/Documentos Fiscais

#### 2.11.1. Download DANFE
```http
GET {{URL}}:45715/external/integrations/thirdparty/billing/danfe/{documentId}
Authorization: base64(clientId:clientSecret)
Token: {{syndata}}
X-Integration-Key: {{integration_key}}
```

> Endpoint **anônimo** — não usa OAuth2. Auth via headers especiais.

#### 2.11.2. Emitir NFS-e
```http
POST {{URL}}:45715/external/integrations/thirdparty/billing/nfse
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

#### 2.11.3. Emitir NFCom
```http
POST {{URL}}:45715/external/integrations/thirdparty/billing/nfcom
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

### 2.12. Módulo: Mensageria Ativa (Batch)

```http
POST {{URL}}:45715/external/integrations/thirdparty/messaging/batch
Authorization: Bearer {{access_token}}
Content-Type: application/json
Idempotency-Key: {{optional_guid}}
```

- Rate limit: **30 req/min** por integrador
- 1 a 100 items por requisição
- Suporta partial success (HTTP 207)

---

## 3. API Portal V2 (App Cliente)

### 3.1. Autenticação (Login do Cliente)

```http
POST {{API_PATH}}/login
Content-Type: application/json
```

**Headers:**
| Header | Valor | Descrição |
|--------|-------|-----------|
| `verify_token` | `TWpNMU9EYzV...` | Token de verificação |
| `client_id` | `101_<hash>` | ID do client app |
| `client_secret` | `ff2a837ab0e8...` | Secret do client app |

**Body:**
```json
{
  "grant_type": "password",
  "username": "usuario_portal",
  "password": "senha_portal"
}
```

> O `API_PATH` é obtido na rotina "Suíte / Configurações / Parâmetros" menu "App Cliente".

### 3.2. Dados do Usuário
```http
GET {{API_PATH}}/user
Authorization: Bearer {{token}}
```

> Retorna informações do usuário logado.

### 3.3. Contratos

#### 3.3.1. Consultar Contrato
```http
GET {{API_PATH}}/contracts
Authorization: Bearer {{token}}
```

#### 3.3.2. Criar Contrato
```http
POST {{API_PATH}}/contracts
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Campos do contrato:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `contractTypeId` | int | ID do tipo de contrato |
| `clientId` | int | **Obrigatório** - ID do cliente |
| `placeId` | int | ID do local |
| `stage` | int | Estágio: 1-Pré, 2-Em aprovação, 3-Aprovado, 4-Rejeitado, 5-Cancelado |
| `status` | int | Status: 1-Normal, 2-Demo, 3-Cortesia, 4-Cancelado, 5-Suspenso, 6-Bloq.Financeiro, 7-Bloq.Admin, 9-Encerrado |
| `contractValue` | decimal | Valor do contrato |
| `docketExpiration` | int | Vencimento do boleto |
| `expirationDay` | int | Dia do vencimento |

#### 3.3.3. Desbloquear Contrato
```http
POST {{API_PATH}}/contracts/{id}/unlock
Authorization: Bearer {{token}}
```

### 3.4. Conexões

#### 3.4.1. Listar Conexões
```http
GET {{API_PATH}}/connections
Authorization: Bearer {{token}}
```

#### 3.4.2. Extrato de Conexão
```http
GET {{API_PATH}}/connections/{id}/extract
Authorization: Bearer {{token}}
```

### 3.5. Títulos (Financeiro) ⭐

#### 3.5.1. Listar Títulos
```http
GET {{API_PATH}}/titles
Authorization: Bearer {{token}}
```

> Retorna todos os títulos do usuário (boletos, faturas). Inclui `hash` para download do PDF.

#### 3.5.2. Download Boleto PDF
```http
GET {{API_PATH}}/titles/{hash}/pdf
Authorization: Bearer {{token}}
```

> Retorna o `.pdf` do boleto para impressão usando a `hash` obtida no método "Lista Títulos".

### 3.6. Notas Fiscais

#### 3.6.1. Listar Notas Fiscais
```http
GET {{API_PATH}}/invoices
Authorization: Bearer {{token}}
```

#### 3.6.2. Imprimir Nota Fiscal
```http
GET {{API_PATH}}/invoices/{id}/print
Authorization: Bearer {{token}}
```

### 3.7. Etiquetas e Catálogos

#### 3.7.1. Listar Etiquetas do Cliente
```http
GET {{API_PATH}}/tags
Authorization: Bearer {{token}}
```

#### 3.7.2. Catálogo de Serviço da Etiqueta
```http
GET {{API_PATH}}/tags/{id}/catalog
Authorization: Bearer {{token}}
```

### 3.8. Solicitações (Service Desk)

#### 3.8.1. Tipos de Situação de Solicitações
```http
GET {{API_PATH}}/solicitation-status
Authorization: Bearer {{token}}
```

#### 3.8.2. Tipos de Solicitação
```http
GET {{API_PATH}}/solicitation-types
Authorization: Bearer {{token}}
```

> Retorna apenas solicitações com opção "Cliente seleciona" habilitada.

#### 3.8.3. Listar Solicitações do Usuário
```http
GET {{API_PATH}}/solicitations
Authorization: Bearer {{token}}
```

#### 3.8.4. Abrir Solicitação
```http
POST {{API_PATH}}/solicitations
Authorization: Bearer {{token}}
Content-Type: application/json
```

#### 3.8.5. Apontamento em Solicitação
```http
POST {{API_PATH}}/solicitations/{id}/report
Authorization: Bearer {{token}}
Content-Type: application/json
```

### 3.9. Recuperação de Senha
```http
POST {{API_PATH}}/password-recovery
Content-Type: application/json
```

---

## 4. Padrão de Resposta da API Voalle

Todas as respostas seguem o envelope padrão:

```json
{
  "success": true,
  "messages": null,
  "response": {},
  "dataResponseType": "List<Int64>",
  "elapsedTime": null
}
```

> [!CAUTION]
> O payload útil vem em **`response`**, não em `data`. Desserializar direto para lista/objeto (ignorando o envelope) faz toda chamada retornar vazio **sem erro aparente** — falha silenciosa.

| Campo | Observação |
|-------|------------|
| `success` | Booleano. **Sempre checar** — pode vir `false` com HTTP 200 |
| `messages` | `null` no caminho feliz. Pode ser string vazia, string ou lista, dependendo do endpoint |
| `response` | Objeto **ou** array, dependendo do endpoint |
| `dataResponseType` | Metadado do tipo .NET interno da Voalle. Ignorar |
| `elapsedTime` | Frequentemente `null`. Não usar para telemetria |

**Tipos de `messages.type`:**
| Type | Significado |
|------|------------|
| `Success` | Operação bem-sucedida |
| `Warn` | Aviso (operação concluída com ressalvas) |
| `Error` | Erro (operação falhou) |

> [!WARNING]
> O HTTP status pode retornar `200 OK` mesmo quando `success: false`. **Sempre verifique o campo `success` no corpo da resposta**, não apenas o status HTTP.

---

## 5. Regras de Negócio para FIKTA

### 5.1. Fluxo de Busca de Cliente (Cadastro Manual)

```
Admin → Digita CPF/CNPJ → Backend chama Third Party API
  → GET /people/txid/{CPF_CNPJ}
  → Se encontrado: retorna dados (nome, email, tel, endereço)
  → Admin confirma importação → salva no banco local FIKTA
  → GET /contracts?txId={CPF_CNPJ}&onlyActiveContracts=true
  → Mapeia plano contratado + valor
```

### 5.2. Fluxo de Verificação de Inadimplência

```
Cliente acessa FIKTA → Eligibility Engine verifica:
  → GET /getopentitlesbytxid/{CPF_CNPJ}
  → Filtra faturas com vencimento passado (em atraso)
  → Se possui títulos vencidos > X dias → INADIMPLENTE
  → Se contrato com status 6 (Bloqueio Financeiro) → BLOQUEADO
  → Aplica grace period local → Libera/Bloqueia acesso
```

### 5.3. Mapeamento de Planos

```
Contrato ativo no Voalle → Contém serviceProductCode
  → GET /crm/contracttypesandservices retorna tipos de contrato e serviços vinculados
  → GET /crm/campaigns retorna campanhas com listas de preço
  → Mapeia para plano no FIKTA (Basic, Premium, etc.)
```

---

## 6. Limites e Boas Práticas

| Item | Limite |
|------|--------|
| Rate limit | 30 req/min por integrador |
| Token TTL | 3600s (1 hora) |
| PageSize | Aceita: 5, 10, 20, 25, 50, 100 |
| Timeout recomendado | 5 segundos |
| Formatos de arquivo | csv, docx, gif, doc, gz, jpeg, jpg, pdf, png, ppt, pptx, rar, tar, txt, xls, xlsx, zip |

> [!CAUTION]
> - Todo request gera log no ERP Voalle com o nome do usuário integrador
> - O usuário integrador **NÃO** consegue logar na interface do ERP, apenas na API
> - Credenciais de Staging/Homologação são diferentes de Produção
> - Use syndata do ambiente correto

---

## 7. Estratégia de Cache e Persistência

> [!IMPORTANT]
> O limite de **30 req/min por integrador** é a restrição que dita todo o desenho. Com 500 assinantes ativos, consultar o ERP a cada page load estoura o limite em segundos e derruba a experiência de todos os clientes daquele provedor ao mesmo tempo. **Nenhuma chamada ao Voalle pode acontecer no caminho síncrono de renderização de tela.**

### 7.1. Princípio

Persistimos no Postgres da FIKTA tudo que é **estável**, e tratamos como volátil apenas o que muda sozinho no ERP — essencialmente o financeiro. O ERP é a fonte da verdade; nosso banco é uma projeção com data de validade.

Cada registro espelhado carrega três colunas de controle:

| Coluna | Uso |
|--------|-----|
| `external_id` | ID do registro no Voalle |
| `synced_at` | Quando veio do ERP pela última vez |
| `sync_source` | `ERP_VOALLE`, `MANUAL`, `SEED` — de onde o dado veio |

### 7.2. Camadas por volatilidade

| Camada | Dado | Origem | TTL | Como atualiza |
|--------|------|--------|-----|---------------|
| **0** | `access_token` | `/connect/token` | `expires_in - 60s` | Em memória/Redis, **por provedor** |
| **1** | Catálogo de serviços | `crm/contracttypesandservices` | 24 h | Job noturno + botão "Sincronizar" no admin |
| **2** | Cadastro do cliente | `people/txid/{txId}` | 7 dias | On-demand no cadastro; refresh manual |
| **3** | Contratos / plano ativo | `contracts?txId=` | 6 h | Job + no login do B2C se vencido |
| **4** | Faturas em aberto | `getopentitlesbytxid/{txId}` | 10 min | *Stale-while-revalidate* |
| **—** | Link do boleto | `GetBilletLink/{id}` | **não cachear** | Sempre on-demand |
| **—** | PDF do boleto | `GetBillet/{id}` | **não cachear** | Sempre on-demand, via stream |

> [!CAUTION]
> **Camada 0 é a economia mais barata e a mais esquecida.** Sem cache de token, toda chamada de negócio vira duas chamadas HTTP — metade do orçamento de rate limit é gasto só autenticando. O token vale 1 hora e é reaproveitável entre todos os clientes daquele provedor.

### 7.3. Faturas — *stale-while-revalidate*

Faturas são o dado que o cliente mais olha e o que mais muda. Bloquear a tela esperando o ERP é inaceitável, e cachear por muito tempo mostra fatura paga como em aberto. O meio-termo:

```
Cliente abre "Minhas Faturas"
  ├─ Sempre responde IMEDIATAMENTE com o que está no banco
  ├─ Marca a resposta com `synced_at` (a UI mostra "atualizado há 3 min")
  └─ Se synced_at > 10 min → dispara refresh ASSÍNCRONO em background
       └─ Terminou → atualiza banco → push/refetch na UI
```

Invalidação forçada (ignora o TTL) em três situações:

1. Cliente clica em **"Atualizar agora"** — com *rate limit por cliente* de 1x/min, senão vira um canhão apontado para o ERP
2. Webhook de pagamento confirmado, quando o provedor suportar
3. Admin do provedor força ressincronização do assinante

> [!WARNING]
> `getopentitlesbytxid` **não** tem campo `status` — se o cliente pagou, a fatura simplesmente some da resposta. A rotina de sync precisa fazer *diff*: título que estava no banco e sumiu do ERP deve ser marcado como `PAID_OR_REMOVED`, nunca deletado silenciosamente. Para saber o que de fato aconteceu, consultar `gettitlesbytxid`, que traz `billet.status` e `billet.receipts`.

### 7.4. Elegibilidade (inadimplência)

O veredito de bloqueio **não** é recalculado a cada request. É materializado em `Customer` e recalculado quando a camada 4 atualiza:

| Coluna | Conteúdo |
|--------|----------|
| `is_delinquent` | Resultado consolidado |
| `overdue_days` | Maior atraso entre os títulos |
| `overdue_amount` | Soma de `billet.amount.finalValue` dos vencidos |
| `eligibility_checked_at` | Quando foi calculado |

Assim o *guard* de leitura consulta só o banco local — custo zero de API por page view. Ver [ELIGIBILITY.md](./ELIGIBILITY.md).

> [!NOTE]
> **Degradação segura:** se o ERP estiver fora do ar, o assinante continua lendo com base no último veredito conhecido, respeitando o *grace period*. Um provedor com ERP instável não pode virar um provedor com clientes bloqueados.

### 7.5. O que nunca persistir

- **Link do boleto** — vem assinado com `validationCode` e expira; guardar significa entregar link morto ao cliente
- **PDF do boleto** — repassar por stream, sem gravar em disco. É dado financeiro nominal e o link cobre 99% dos casos
- **`pixQRCode`** — mesmo raciocínio; buscar junto com a fatura no momento do pagamento
- **Credenciais do ERP em texto claro** — `client_secret`, `syndata` e `refresh_token` são AES-256 em `IntegrationCredential`

### 7.6. Orçamento de chamadas

Estimativa para um provedor com 500 assinantes, dentro do teto de 30 req/min:

| Operação | Frequência | Chamadas/dia |
|----------|-----------|--------------|
| Token | 1x/hora por provedor | 24 |
| Sync catálogo de serviços | 1x/dia | 1 |
| Sync faturas (job, escalonado) | 4x/dia × 500 | 2.000 |
| Refresh manual do cliente | ~5% dos assinantes/dia | ~25 |
| Cadastro de novos clientes | ~10/dia × 2 | 20 |
| **Total** | | **~2.070** |

Distribuído em 24 h dá ~1,4 req/min — folga confortável dentro do teto. Sem cache, os mesmos 500 assinantes abrindo o app 3x/dia gerariam ~3.000 chamadas concentradas no horário de pico, **estourando o limite**.

> [!TIP]
> O job de sync de faturas deve ser **escalonado por assinante** (espalhado ao longo da hora), não um lote de 500 chamadas às 03:00. Um burst de 500 requests derruba o rate limit mesmo com folga na média diária.
