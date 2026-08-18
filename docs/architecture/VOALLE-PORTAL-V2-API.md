# ERP Voalle — API Portal V2 (App Cliente) — **API PRINCIPAL**

> [!IMPORTANT]
> **Esta é a API oficial da integração FIKTA a partir de agora**, homologada para a **UNE TELECOM**.
> A API Third Party, documentada em [VOALLE-API-REFERENCE.md](./VOALLE-API-REFERENCE.md), passa a ser **backup / fallback** — mantida para provedores que não exponham o App Cliente, e como referência de endpoints administrativos que a Portal V2 não cobre.

---

## 1. Por que a Portal V2 e não a Third Party

| Critério | Portal V2 (esta) | Third Party (backup) |
|----------|------------------|----------------------|
| Escopo | Dados **do próprio cliente** logado | Toda a base do provedor |
| Autenticação | Login do assinante (usuário/senha do portal) | Integrador global (`client_credentials`) |
| Conexões / status de link | ✅ `authentications` | ❌ limitado |
| Chamados do cliente | ✅ listar e **abrir** | parcial |
| Notas fiscais | ✅ | ✅ |
| Superfície de risco | Só enxerga o titular autenticado | Chave mestra do provedor |

O ponto decisivo é o último: na Portal V2 o token é do assinante, então um vazamento expõe **um** cliente, não a base inteira do provedor. É também a única que entrega **conexões** e **abertura de chamado**, que é exatamente o conteúdo do Super Portal B2C.

---

## 2. Configuração por provedor

Todos os parâmetros abaixo vêm da rotina **Suíte / Configurações / Parâmetros → menu App Cliente**, acessível apenas por usuários do tipo **Administrador** no ERP do provedor.

| Parâmetro | Onde usar | Segredo? |
|-----------|-----------|:--------:|
| `Api_Path` | Host base da API | não |
| `verify_token` | Query na autenticação **e** header `Verify-Token` em todas as demais | **sim** |
| `client_id` | Query na autenticação | **sim** |
| `client_secret` | Query na autenticação | **sim** |

> [!CAUTION]
> `verify_token`, `client_id` e `client_secret` são **credenciais do provedor** e devem ser gravados criptografados (AES-256) em `IntegrationCredential`, nunca em `appsettings.json` nem em constantes no código.

---

## 3. Autenticação

```http
GET {{Api_Path}}/portal_authentication
    ?verify_token={{verify_token}}
    &client_id={{client_id}}
    &client_secret={{client_secret}}
    &grant_type=client_credentials
    &username={{usuario_do_portal}}
    &password={{senha_do_portal}}
```

**Response (200):**
```json
{
  "access_token": "token",
  "expires_in": 14400,
  "token_type": "bearer",
  "scope": null,
  "person": {
    "id": 123456,
    "name": "Cliente teste",
    "nameList": "Cliente teste"
  }
}
```

> [!WARNING]
> **As credenciais viajam na query string.** Isso significa que elas entram em log de servidor, de proxy e de browser. Consequências obrigatórias para nós:
> - Esta chamada só pode partir do **backend**, jamais do navegador do assinante
> - A URL **nunca** pode ser logada — mascarar `client_secret` e `password` antes de qualquer `LogInformation`
> - Exige HTTPS; em HTTP a senha do cliente trafega legível

> [!NOTE]
> `expires_in` é **14400s (4 h)** — quatro vezes o token da Third Party. E `person.id` já vem na resposta: é o `{{person_id}}` usado em quase todos os outros endpoints, então **guarde-o junto do token**, evitando um `whoami` extra a cada sessão.

### Headers das demais chamadas

```http
Authorization: Bearer {{access_token}}
Verify-Token: {{verify_token}}
```

> [!CAUTION]
> São **dois** segredos por request. Faltar o `Verify-Token` é o erro mais comum ao portar código da Third Party, que não o utiliza.

---

## 4. Endpoints

### 4.1. Whoami — dados cadastrais

```http
GET {{url}}/api/person_users/whoami
```

Retorna o cadastro completo do titular em `data`. Campos que nos interessam:

| Campo | Uso na FIKTA |
|-------|--------------|
| `id` | `Customer.ExternalId` |
| `txId` | CPF/CNPJ → `Customer.Document` |
| `typeTxId` | `1` = CNPJ, `2` = CPF |
| `name` | `Customer.Name` |
| `email` | `Customer.Email` |
| `cellPhone1` / `phone` | `Customer.Phone` |
| `birthDate` | `Customer.BirthDate` |
| `status` / `situation` | Situação cadastral |
| `client` | `true` confirma que é cliente de fato |
| `peopleAddress` | Endereço principal |

> [!NOTE]
> O payload traz ~150 campos, a maioria contábil/fiscal irrelevante para nós (`aliquotIrr`, `retainsInss`, `debitAccountCode`…). Mapear **apenas** os da tabela — desserializar tudo cria acoplamento gratuito a um schema que não controlamos.
> Note que o envelope aqui é **`data`**, e não `response` como na Third Party.

### 4.2. Contratos da pessoa

```http
GET {{url}}/api/people/{{person_id}}/contracts
```

Envelope: `{ "data": [...], "count", "filtered", "total" }`

| Campo | Uso |
|-------|-----|
| `id` | Id do contrato, usado em conexões e títulos |
| `contractNumber` | Número visível ao cliente |
| `status` | Situação do contrato (ver §5) |
| `contractType.title` | Tipo — casa com o mapeamento de plano |
| `collectionDay` | Dia de vencimento |
| `automaticBlocking` | Se o ERP bloqueia por inadimplência sozinho |
| `beginningDate` / `finalDate` | Vigência |

### 4.3. Conexões — **alimenta o "Status de Conexão"**

```http
GET {{url}}/api/people/{{person_id}}/authentications
```

| Campo | Uso na tela |
|-------|-------------|
| `active` | Conexão ativa/inativa |
| `serviceProduct.title` | Plano contratado, ex. "8 Mbps Radio Empresarial" |
| `contract.status` | Situação do contrato vinculado |
| `contract.remainingUnblockAttempts` | Quantos desbloqueios de confiança restam |
| `wifiName` / `wifiPassword` | Dados do Wi-Fi |
| `equipmentSerialNumber` | Serial da ONU/roteador |
| `street`, `number`, `city` | Endereço de instalação |

> [!CAUTION]
> Este endpoint devolve **`password`, `equipmentPassword` e `wifiPassword` em texto claro**. Nunca repassar esses campos ao frontend nem persistir. O backend deve descartá-los na desserialização; `wifiName` pode ser exibido, `wifiPassword` só sob ação explícita do titular.

### 4.4. Títulos (faturas)

```http
GET {{url}}/api/portal_financial_receivable_titles
```

Não recebe `person_id`: o token **já é** do cliente, então retorna os títulos dele.

| Campo | Uso |
|-------|-----|
| `id` | Id do título |
| `title` | Número da fatura, ex. `FAT123456789` |
| `balance` | **Saldo devedor — é este o valor a cobrar** |
| `titleAmount` | Valor do título |
| `documentAmount` | Valor do documento |
| `interestAmount` / `fineAmount` | Juros e multa |
| `expirationDate` | Vencimento |
| `originalExpirationDate` | Vencimento original, antes de prorrogação |
| `typefulLine` | Linha digitável (pode vir `null`) |
| `hash` | **Chave para baixar o PDF do boleto** |
| `finished` | Título encerrado |

> [!WARNING]
> **Não existe campo `status`.** A situação é derivada:
> - `balance == 0` ou `finished == true` → paga/encerrada
> - `balance > 0` e `expirationDate < hoje` → **vencida**
> - `balance > 0` e `expirationDate >= hoje` → em aberto
>
> E o valor a cobrar é **`balance`**, não `titleAmount` — um título parcialmente pago tem `titleAmount` cheio e `balance` residual.

### 4.5. Boleto em PDF

```http
GET {{url}}/api/financial/billet/{{hash}}
```

O `hash` vem de §4.4. Retorna PDF binário.

> [!NOTE]
> Ao contrário da Third Party, aqui **não há endpoint de link** — só o PDF. O backend precisa fazer proxy do stream, o que torna o cache do `hash` (não do arquivo) o ponto de economia.

### 4.6. Notas fiscais

```http
GET {{url}}/api/portal_invoice_notes          # lista
GET {{url}}/api/print_invoice_notes/{{id}}    # imagem para impressão
```

Campos úteis: `documentNumber`, `issueDate`, `totalAmountLiquid`, `status`, `contract.contractNumber`.

### 4.7. Chamados (Service Desk)

```http
GET  {{url}}/api/portal_solicitations                        # histórico do cliente
GET  {{url}}/api/portal_incident_types                       # tipos disponíveis
GET  {{url}}/api/portal_service_level_agreements             # situações (SLA)
GET  {{url}}/api/portal_contract_service_tags                # etiquetas de serviço
GET  {{url}}/api/portal_catalog_services                     # catálogo de serviço
POST {{url}}/api/people/{{person_id}}/solicitations          # abrir chamado
```

**Abertura de chamado** — body `multipart/form-data`:

| Campo | Obrigatório | Observação |
|-------|:-----------:|------------|
| `companyPlaceId` | ✅ | Local, de *Suíte / Cadastros / Locais* |
| `incidentStatusId` | ✅ | **Sempre `1`** (Abertura) |
| `personId` | ✅ | Deve ser **igual** ao `person_id` da URL |
| `incidentTypeId` | ✅ | Tipo de solicitação |
| `serviceLevelAgreementId` | ✅ | Situação/SLA |
| `title` | ✅ | Título |
| `description` | ✅ | Descrição |
| `contractServiceTagId` | ❌ | Depende da parametrização do tipo |
| `catalogServiceId` | ❌ | Depende da parametrização do tipo |

Resposta traz `data.protocol` — o número de protocolo a exibir ao cliente.

> [!CAUTION]
> É `multipart/form-data`, **não JSON**. E `personId` no corpo precisa bater com o `{{person_id}}` da URL; divergência é rejeitada pelo ERP.
> Os IDs (`companyPlaceId`, `incidentTypeId`, `serviceLevelAgreementId`) **variam por provedor** — precisam ser configuráveis por tenant, nunca constantes.

### 4.8. Outros

```http
POST {{url}}/api/contracts                       # criar contrato
POST {{url}}/api/contracts/{{id}}/unblock        # desbloqueio de confiança
GET  {{url}}/api/authentications/{{id}}/extract  # extrato de consumo da conexão
POST {{url}}/api/portal_recover_password         # recuperar senha
```

---

## 5. Códigos de status de contrato

`status` em §4.2/§4.3 é inteiro. Os valores observados na collection não vêm documentados de forma exaustiva — **confirmar com a UNE TELECOM antes de usar em regra de bloqueio**.

| Valor | Interpretação provável |
|:-----:|------------------------|
| 1 | Ativo |
| 7 | Encerrado / vencido |

> [!WARNING]
> Não implementar bloqueio de leitura baseado neste campo enquanto a tabela não estiver confirmada. Usar a derivação por títulos (§4.4), que é determinística.

---

## 6. Diferenças ao portar da Third Party

Armadilhas ao migrar código do adapter existente:

| Aspecto | Third Party (backup) | Portal V2 (esta) |
|---------|----------------------|------------------|
| Envelope | `response` | **`data`** |
| Sucesso | Campo `success` | **Não existe** — usar HTTP status |
| Auth | `Authorization` | `Authorization` **+ `Verify-Token`** |
| Token | 3600s | **14400s** |
| Escopo | Provedor inteiro | Um assinante |
| Chave do financeiro | `txId` (CPF/CNPJ) | Implícita no token |
| Valor devido | `billet.amount.finalValue` | **`balance`** |
| Situação da fatura | Ausente (só abertas) | Ausente — derivar de `balance` + data |
| Boleto | PDF **e** link | **Só PDF**, via `hash` |
| Paginação | `page`/`pageSize` | `count`/`filtered`/`total` |

---

## 7. Cache

A estratégia de camadas de [VOALLE-API-REFERENCE.md §7](./VOALLE-API-REFERENCE.md#7-estratégia-de-cache-e-persistência) continua valendo, com dois ajustes:

1. **Token por assinante, não por provedor.** Cada cliente tem o seu, com 4 h de validade. A chave de cache é `(provider_id, person_id)`.
2. **Conexões** entram como camada nova: TTL de ~5 min. É o dado que o cliente atualiza compulsivamente quando a internet cai, e justamente aí o ERP não pode ser martelado.

> [!NOTE]
> A Portal V2 não publica limite de requisições como os 30 req/min da Third Party. **Ausência de limite documentado não é ausência de limite** — manter o mesmo orçamento conservador até a UNE TELECOM confirmar.

---

## 8. Pendências antes de implementar

- [ ] `Api_Path`, `verify_token`, `client_id` e `client_secret` da UNE TELECOM
- [ ] Confirmar a tabela de `status` de contrato (§5)
- [ ] `companyPlaceId`, `incidentTypeId` e `serviceLevelAgreementId` padrão para abertura de chamado
- [ ] Definir a origem de usuário/senha do portal: o assinante digita as credenciais do ERP, ou a FIKTA mantém um usuário técnico?

> [!IMPORTANT]
> O último item é uma decisão de produto, não técnica, e bloqueia o desenho da tela de login do B2C. Se cada assinante autentica com a própria senha do portal do provedor, o fluxo de login da FIKTA muda: deixa de ser conta própria e passa a ser federada com o ERP.
