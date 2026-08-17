# ERP Voalle - Referência Completa de APIs

Este documento detalha **todas as APIs do ERP Voalle** utilizadas no projeto FIKTA para integração com provedores ISP. São **duas APIs distintas** com propósitos diferentes.

> [!IMPORTANT]
> Este ERP (Voalle) é o sistema de gestão utilizado pelos provedores de internet (ISPs) parceiros. A FIKTA integra com ele para buscar dados de clientes, verificar inadimplência e mapear planos contratados.

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
| `client_id` | `19681110000194` | Usuário integrador (CNPJ) |
| `client_secret` | `ffd8f69d40ec56e587d3268c15991cd0c1ce36e8` | Senha hash do integrador |
| `syndata` | `TWpNMU9EYzVaakk1...` | Token criptografado do tenant |

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
GET {{URL}}:45715/external/integrations/thirdparty/people/search?txId={{CPF_CNPJ}}
Authorization: Bearer {{access_token}}
```

> [!TIP]
> **Este é o endpoint principal para nosso fluxo de cadastro de clientes.**
> São retornados apenas registros com atributo "cliente" marcado no ERP.

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

#### 2.5.1. Buscar Faturas em Aberto por CPF/CNPJ
```http
GET {{URL}}:45715/external/integrations/thirdparty/financial/invoices?txId={{CPF_CNPJ}}
Authorization: Bearer {{access_token}}
```

> São listadas faturas **em aberto** e **em atraso**, ou com vencimento para o próximo mês da consulta.

#### 2.5.2. Buscar Faturas em Aberto por Contrato
```http
GET {{URL}}:45715/external/integrations/thirdparty/financial/invoices?contractId={{CONTRACT_ID}}
Authorization: Bearer {{access_token}}
```

#### 2.5.3. Liquidar Fatura (Pagamento)
```http
POST {{URL}}:45715/external/integrations/thirdparty/financial/invoices/settle
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

#### 2.5.4. Registrar Pix por ID de Título
```http
POST {{URL}}:45715/external/integrations/thirdparty/financial/pix/{titleId}
Authorization: Bearer {{access_token}}
```

> Requer parametrização do PIX Voalle no cadastro de Locais do ERP.

#### 2.5.5. Criar Valor Eventual (Acréscimo/Desconto)
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

#### 2.9.4. Consultar Tipos de Contrato e Serviços
```http
GET {{URL}}:45715/external/integrations/thirdparty/crm/contract-types
Authorization: Bearer {{access_token}}
```

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
| `client_id` | `101_e920d9ce...` | ID do client app |
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
  "data": { ... },
  "messages": [
    {
      "message": "Operação realizada com sucesso",
      "code": 200,
      "type": "Success"
    }
  ],
  "elapsedTime": 12.54
}
```

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
  → GET /people/search?txId={CPF_CNPJ}
  → Se encontrado: retorna dados (nome, email, tel, endereço)
  → Admin confirma importação → salva no banco local FIKTA
  → GET /contracts?txId={CPF_CNPJ}&onlyActiveContracts=true
  → Mapeia plano contratado + valor
```

### 5.2. Fluxo de Verificação de Inadimplência

```
Cliente acessa FIKTA → Eligibility Engine verifica:
  → GET /financial/invoices?txId={CPF_CNPJ}
  → Filtra faturas com vencimento passado (em atraso)
  → Se possui títulos vencidos > X dias → INADIMPLENTE
  → Se contrato com status 6 (Bloqueio Financeiro) → BLOQUEADO
  → Aplica grace period local → Libera/Bloqueia acesso
```

### 5.3. Mapeamento de Planos

```
Contrato ativo no Voalle → Contém serviceProductCode
  → GET /crm/contract-types retorna tipos de contrato e serviços vinculados
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
