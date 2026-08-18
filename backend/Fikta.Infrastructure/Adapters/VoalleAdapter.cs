using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Fikta.Application.Common.Interfaces;
using Fikta.Application.Common.Models;

namespace Fikta.Infrastructure.Adapters;

public class VoalleAdapter : IExternalCustomerProvider, IExternalProductProvider, IExternalFinancialProvider
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<VoalleAdapter> _logger;

    /// <summary>
    /// Access tokens cached per provider. Voalle limits integrators to 30 req/min, so
    /// re-authenticating on every business call would burn half of that budget on tokens
    /// alone. The token is valid for 1h and is reusable across all subscribers of the
    /// same provider. See docs/architecture/VOALLE-API-REFERENCE.md §7.2 (camada 0).
    /// </summary>
    private static readonly ConcurrentDictionary<string, CachedToken> _tokenCache = new();

    /// <summary>Renew this long before the real expiry, so a token never expires mid-flight.</summary>
    private static readonly TimeSpan TokenSafetyMargin = TimeSpan.FromSeconds(60);

    private sealed record CachedToken(string AccessToken, DateTimeOffset ExpiresAt);

    public VoalleAdapter(IHttpClientFactory httpClientFactory, ILogger<VoalleAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    private string BuildUrl(string baseUrl, int port, string path)
    {
        var cleanBase = baseUrl.TrimEnd('/');
        
        // If baseUrl already includes a port, strip it for clean assembly
        if (Uri.TryCreate(cleanBase, UriKind.Absolute, out var uri))
        {
            var builder = new UriBuilder(uri)
            {
                Port = port,
                Path = path
            };
            return builder.ToString();
        }

        return $"{cleanBase}:{port}{path}";
    }

    private async Task<string> GetAccessTokenAsync(HttpClient client, IntegrationSettings settings)
    {
        var cacheKey = $"{settings.EndpointUrl}|{settings.ClientId}";

        if (_tokenCache.TryGetValue(cacheKey, out var cached) && cached.ExpiresAt > DateTimeOffset.UtcNow)
        {
            return cached.AccessToken;
        }

        try
        {
            var authUrl = BuildUrl(settings.EndpointUrl, 45700, "/connect/token");
            _logger.LogInformation("Requesting access token from Voalle Auth at {AuthUrl}", authUrl);
            
            var request = new HttpRequestMessage(HttpMethod.Post, authUrl);
            
            var contentParameters = new Dictionary<string, string>
            {
                { "grant_type", "client_credentials" },
                { "scope", "syngw" },
                { "client_id", settings.ClientId },
                { "client_secret", settings.ClientSecret },
                { "syndata", settings.Syndata }
            };
            
            request.Content = new FormUrlEncodedContent(contentParameters);

            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errorPayload = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to authenticate with Voalle. Status: {StatusCode}, Error: {Error}", response.StatusCode, errorPayload);
                throw new InvalidOperationException($"Voalle authentication failed with status {response.StatusCode}: {errorPayload}");
            }

            var tokenResponse = await response.Content.ReadFromJsonAsync<VoalleTokenResponse>();
            if (tokenResponse == null || string.IsNullOrWhiteSpace(tokenResponse.AccessToken))
            {
                throw new InvalidOperationException("Voalle authentication returned empty token response");
            }

            // expires_in is in seconds (typically 3600). Fall back to a conservative 5 min if absent.
            var lifetime = tokenResponse.ExpiresIn > 0
                ? TimeSpan.FromSeconds(tokenResponse.ExpiresIn)
                : TimeSpan.FromMinutes(5);

            if (lifetime > TokenSafetyMargin)
            {
                _tokenCache[cacheKey] = new CachedToken(
                    tokenResponse.AccessToken,
                    DateTimeOffset.UtcNow + lifetime - TokenSafetyMargin);
            }

            return tokenResponse.AccessToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while retrieving token from Voalle API");
            throw;
        }
    }

    private async Task<HttpClient> CreateConfiguredClientAsync(IntegrationSettings settings)
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds > 0 ? settings.TimeoutSeconds : 10);

        var token = await GetAccessTokenAsync(client, settings);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        return client;
    }

    public async Task<NormalizedCustomerDto?> GetCustomerByDocumentAsync(string document, IntegrationSettings settings)
    {
        try
        {
            var client = await CreateConfiguredClientAsync(settings);

            // Voalle takes the document in the PATH (digits only), not as a query string.
            var txId = OnlyDigits(document);
            var url = BuildUrl(settings.EndpointUrl, 45715, $"/external/integrations/thirdparty/people/txid/{txId}");

            _logger.LogInformation("Querying customer by document from Voalle at URL: {Url}", url);
            var response = await client.GetAsync(url);

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();

            // This endpoint returns a single object in `response`, not an array.
            var envelope = await response.Content.ReadFromJsonAsync<VoalleEnvelope<VoallePersonResponse>>();
            if (envelope?.Response == null || !envelope.Success)
            {
                _logger.LogInformation("Voalle returned no person for document {Document}", txId);
                return null;
            }

            var voallePeople = new List<VoallePersonResponse> { envelope.Response };

            // Map the first matching person
            var person = voallePeople[0];
            var customer = new NormalizedCustomerDto
            {
                ExternalId = person.Id?.ToString() ?? string.Empty,
                Name = person.Name,
                Email = person.Email ?? string.Empty,
                Phone = person.CellPhone ?? person.Phone ?? string.Empty,
                Document = person.TxId,
                Status = person.IsActive ? "ACTIVE" : "INACTIVE"
            };

            // Retrieve contracts for this user
            customer.Contracts = await GetCustomerContractsInternalAsync(client, customer.ExternalId, settings);

            return customer;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve customer by document {Document} from Voalle", document);
            return null;
        }
    }

    public async Task<List<NormalizedCustomerDto>> SearchCustomersByNameOrTermAsync(string term, IntegrationSettings settings)
    {
        var customers = new List<NormalizedCustomerDto>();
        // Note: authentication/connectivity failures are intentionally NOT swallowed here (unlike the
        // other methods in this adapter) so the controller can surface the real reason to the caller
        // instead of silently returning zero results, which used to be indistinguishable from "no match".
        var client = await CreateConfiguredClientAsync(settings);
        try
        {
            var cleanTerm = term.Replace(".", "").Replace("-", "").Replace("/", "").Trim();

            // 1. Try search by document first if numbers present
            if (cleanTerm.Length >= 5 && cleanTerm.All(char.IsDigit))
            {
                var docCustomer = await GetCustomerByDocumentAsync(cleanTerm, settings);
                if (docCustomer != null)
                {
                    customers.Add(docCustomer);
                    return customers;
                }
            }

            // 2. Query paginated people list with filter from Voalle ERP
            var url = BuildUrl(settings.EndpointUrl, 45715, $"/external/integrations/thirdparty/people?page=1&pageSize=50&filter={Uri.EscapeDataString(term)}");
            _logger.LogInformation("Searching people by name/term in Voalle ERP at URL: {Url}", url);

            var response = await client.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                List<VoallePersonResponse>? peopleList = null;

                try
                {
                    peopleList = JsonSerializer.Deserialize<List<VoallePersonResponse>>(content);
                }
                catch
                {
                    var paged = JsonSerializer.Deserialize<VoallePeoplePagedResponse>(content);
                    peopleList = paged?.Data;
                }

                if (peopleList != null && peopleList.Count > 0)
                {
                    foreach (var p in peopleList)
                    {
                        customers.Add(new NormalizedCustomerDto
                        {
                            ExternalId = p.Id?.ToString() ?? string.Empty,
                            Name = p.Name,
                            Email = p.Email ?? string.Empty,
                            Phone = p.CellPhone ?? p.Phone ?? string.Empty,
                            Document = p.TxId,
                            Status = p.IsActive ? "ACTIVE" : "INACTIVE"
                        });
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to search customers in Voalle ERP by term {Term}", term);
        }

        return customers;
    }

    public async Task<NormalizedCustomerDto?> GetCustomerByIdAsync(string externalId, IntegrationSettings settings)
    {
        try
        {
            var client = await CreateConfiguredClientAsync(settings);
            var url = BuildUrl(settings.EndpointUrl, 45715, $"/external/integrations/thirdparty/people/{externalId}");

            _logger.LogInformation("Querying customer by ID from Voalle at URL: {Url}", url);
            var response = await client.GetAsync(url);
            
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();

            var person = await response.Content.ReadFromJsonAsync<VoallePersonResponse>();
            if (person == null)
            {
                return null;
            }

            var customer = new NormalizedCustomerDto
            {
                ExternalId = person.Id?.ToString() ?? string.Empty,
                Name = person.Name,
                Email = person.Email ?? string.Empty,
                Phone = person.CellPhone ?? person.Phone ?? string.Empty,
                Document = person.TxId,
                Status = person.IsActive ? "ACTIVE" : "INACTIVE"
            };

            customer.Contracts = await GetCustomerContractsInternalAsync(client, customer.ExternalId, settings);

            return customer;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve customer by ID {ExternalId} from Voalle", externalId);
            return null;
        }
    }

    /// <summary>
    /// Public entry point so callers (e.g. the search-customer endpoint) can fetch a customer's
    /// contracts — and therefore their Voalle service-catalog codes — without duplicating the
    /// token/client setup that GetCustomerByDocumentAsync/GetCustomerByIdAsync already do.
    /// </summary>
    public async Task<List<NormalizedContractDto>> GetCustomerContractsAsync(string customerExternalId, IntegrationSettings settings)
    {
        var client = await CreateConfiguredClientAsync(settings);
        return await GetCustomerContractsInternalAsync(client, customerExternalId, settings);
    }

    private async Task<List<NormalizedContractDto>> GetCustomerContractsInternalAsync(HttpClient client, string customerExternalId, IntegrationSettings settings)
    {
        try
        {
            var url = BuildUrl(settings.EndpointUrl, 45715, $"/external/integrations/thirdparty/contracts?personId={customerExternalId}");
            _logger.LogInformation("Querying contracts from Voalle at URL: {Url}", url);

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to query contracts. Status: {StatusCode}", response.StatusCode);
                return new List<NormalizedContractDto>();
            }

            var voalleContracts = await response.Content.ReadFromJsonAsync<List<VoalleContractResponse>>();
            if (voalleContracts == null)
            {
                return new List<NormalizedContractDto>();
            }

            var contracts = new List<NormalizedContractDto>();
            foreach (var vc in voalleContracts)
            {
                contracts.Add(new NormalizedContractDto
                {
                    ContractId = vc.Id?.ToString() ?? string.Empty,
                    Status = vc.Status == 1 ? "ACTIVE" : "SUSPENDED", // 1 = Active in Voalle contract states
                    ServiceProductCodes = vc.ServiceProductCodes ?? new List<string>()
                });
            }

            return contracts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch contracts for external customer {ExternalId}", customerExternalId);
            return new List<NormalizedContractDto>();
        }
    }

    public async Task<IEnumerable<NormalizedProductDto>> ListProductsAsync(IntegrationSettings settings)
    {
        try
        {
            var client = await CreateConfiguredClientAsync(settings);
            var url = BuildUrl(settings.EndpointUrl, 45715, "/external/integrations/thirdparty/crm/contracttypesandservices");

            _logger.LogInformation("Querying contract types and services from Voalle at URL: {Url}", url);
            var response = await client.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var envelope = await response.Content.ReadFromJsonAsync<VoalleEnvelope<List<VoalleContractTypeResponse>>>();
            if (envelope?.Response == null || !envelope.Success)
            {
                // Empty is the expected result when the provider has not enabled the
                // "Integração" flag on the contract type in the ERP.
                _logger.LogWarning("Voalle returned no contract types. Check the 'Integração' flag on the ERP contract type.");
                return Array.Empty<NormalizedProductDto>();
            }

            // We map the SERVICES, not the contract types: it is the service `code` (e.g. "1.3")
            // that a contract references and that ExternalProductMapping keys the catalog on.
            var products = new List<NormalizedProductDto>();
            foreach (var contractType in envelope.Response)
            {
                foreach (var service in contractType.Services ?? new List<VoalleServiceProductResponse>())
                {
                    if (string.IsNullOrWhiteSpace(service.Code)) continue;

                    products.Add(new NormalizedProductDto
                    {
                        ExternalProductId = service.Code,
                        Name = service.Title ?? string.Empty,
                        // Qualify with the parent contract type so an admin picking "Fibra 300 Mb"
                        // out of a flat list can still tell which plan it belongs to.
                        Description = string.IsNullOrWhiteSpace(service.Description)
                            ? contractType.Title ?? string.Empty
                            : $"{contractType.Title} — {service.Description}"
                    });
                }
            }

            return products;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list products from Voalle");
            return Array.Empty<NormalizedProductDto>();
        }
    }

    /// <summary>
    /// Checks a subscriber's open invoices. Voalle keys the financial endpoints by CPF/CNPJ
    /// (txId), NOT by the internal person id — so callers must pass the document.
    /// </summary>
    public async Task<NormalizedFinancialDto?> GetCustomerFinancialStatusAsync(string customerDocument, IntegrationSettings settings)
    {
        try
        {
            var client = await CreateConfiguredClientAsync(settings);
            var txId = OnlyDigits(customerDocument);
            var url = BuildUrl(settings.EndpointUrl, 45715, $"/external/integrations/thirdparty/getopentitlesbytxid/{txId}");

            _logger.LogInformation("Querying open invoices from Voalle at URL: {Url}", url);
            var response = await client.GetAsync(url);

            // No open invoices is a legitimate "all clear", not an error.
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return new NormalizedFinancialDto { IsDelinquent = false };
            }

            response.EnsureSuccessStatusCode();

            var envelope = await response.Content.ReadFromJsonAsync<VoalleEnvelope<List<VoalleOpenTitleResponse>>>();
            if (envelope == null || !envelope.Success)
            {
                _logger.LogWarning("Voalle reported failure querying open invoices for {TxId}", txId);
                return null;
            }

            var voalleInvoices = envelope.Response;
            if (voalleInvoices == null || voalleInvoices.Count == 0)
            {
                return new NormalizedFinancialDto { IsDelinquent = false };
            }

            var pendingInvoices = new List<NormalizedInvoiceDto>();
            decimal overdueAmount = 0;
            int maxOverdueDays = 0;
            bool isDelinquent = false;

            var today = DateTime.UtcNow.Date;

            // Everything this endpoint returns is by definition open — there is no `status`
            // field to filter on. Overdue is derived from the due date alone.
            foreach (var vi in voalleInvoices)
            {
                var billet = vi.Billet;
                if (billet == null) continue;

                var dueDate = ParseVoalleDate(billet.ExpirationDate);
                if (dueDate == null) continue;

                // finalValue already carries fine/interest/discount; `value` is the raw amount.
                var amount = billet.Amount?.FinalValue ?? 0m;

                var isOverdue = dueDate.Value.Date < today;
                if (isOverdue)
                {
                    isDelinquent = true;
                    overdueAmount += amount;
                    var overdueDays = (today - dueDate.Value.Date).Days;
                    if (overdueDays > maxOverdueDays)
                    {
                        maxOverdueDays = overdueDays;
                    }
                }

                pendingInvoices.Add(new NormalizedInvoiceDto
                {
                    InvoiceId = vi.Id?.ToString() ?? string.Empty,
                    Amount = amount,
                    DueDate = dueDate.Value,
                    Status = isOverdue ? "OVERDUE" : "PENDING"
                });
            }

            return new NormalizedFinancialDto
            {
                IsDelinquent = isDelinquent,
                OverdueAmount = overdueAmount,
                OverdueDays = maxOverdueDays,
                PendingInvoices = pendingInvoices
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check financial status for document {Document} on Voalle", customerDocument);
            return null;
        }
    }

    /// <summary>Strips CPF/CNPJ formatting — Voalle expects digits only in the path.</summary>
    private static string OnlyDigits(string value)
        => string.IsNullOrEmpty(value) ? string.Empty : new string(value.Where(char.IsDigit).ToArray());

    /// <summary>
    /// Voalle mixes date-only ("2018-08-20") and full timestamps ("2021-05-30T00:00:00")
    /// across the financial endpoints, so parsing has to accept both.
    /// </summary>
    private static DateTime? ParseVoalleDate(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed)
            ? parsed
            : null;
    }

    // Helper classes for parsing Voalle JSON structures

    /// <summary>
    /// Every Voalle endpoint wraps its payload in this envelope. The useful data is in
    /// `response` — NOT `data`. Deserializing straight into a list silently yields empty
    /// results with no error, which is how the previous version of this adapter failed.
    /// Note that HTTP 200 does not imply success; always check <see cref="Success"/>.
    /// </summary>
    private class VoalleEnvelope<T>
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("response")]
        public T? Response { get; set; }
    }

    private class VoalleTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;
        
        [JsonPropertyName("token_type")]
        public string TokenType { get; set; } = string.Empty;
        
        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }
    }

    private class VoallePeoplePagedResponse
    {
        [JsonPropertyName("data")]
        public List<VoallePersonResponse>? Data { get; set; }

        [JsonPropertyName("total")]
        public int Total { get; set; }
    }

    private class VoallePersonResponse
    {
        [JsonPropertyName("id")]
        public object Id { get; set; } = null!;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("txId")]
        public string TxId { get; set; } = string.Empty; // CPF/CNPJ

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("cellphone")]
        public string? CellPhone { get; set; }

        [JsonPropertyName("phone")]
        public string? Phone { get; set; }

        /// <summary>
        /// Voalle exposes `status` as an int on the people payload (1 = active).
        /// There is no boolean `active` field, despite what an earlier version assumed.
        /// </summary>
        [JsonPropertyName("status")]
        public int Status { get; set; }

        /// <summary>Null for CNPJ, filled for CPF — useful as a natural-person heuristic.</summary>
        [JsonPropertyName("birthDate")]
        public string? BirthDate { get; set; }

        [JsonIgnore]
        public bool IsActive => Status == 1;
    }

    private class VoalleContractResponse
    {
        [JsonPropertyName("id")]
        public object Id { get; set; } = null!;

        [JsonPropertyName("status")]
        public int Status { get; set; } // 1 = Active

        [JsonPropertyName("serviceProductCodes")]
        public List<string>? ServiceProductCodes { get; set; }
    }

    /// <summary>A contract type from crm/contracttypesandservices.</summary>
    private class VoalleContractTypeResponse
    {
        [JsonPropertyName("code")]
        public string? Code { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        /// <summary>Allowed billing days for this contract type.</summary>
        [JsonPropertyName("collectionDays")]
        public List<int>? CollectionDays { get; set; }

        [JsonPropertyName("contractTypesServiceProduct")]
        public List<VoalleServiceProductResponse>? Services { get; set; }
    }

    /// <summary>
    /// A service inside a contract type. `code` follows "{contractType}.{seq}" (e.g. "1.3")
    /// and is stable per tenant but NOT global — always key it by (provider, code).
    /// </summary>
    private class VoalleServiceProductResponse
    {
        [JsonPropertyName("code")]
        public string? Code { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }
    }

    /// <summary>An entry from getopentitlesbytxid — the invoice fields live under `billet`.</summary>
    private class VoalleOpenTitleResponse
    {
        [JsonPropertyName("id")]
        public object? Id { get; set; }

        [JsonPropertyName("billet")]
        public VoalleBilletResponse? Billet { get; set; }
    }

    private class VoalleBilletResponse
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }

        /// <summary>
        /// Kept as string: this endpoint returns "2018-08-20" while getcontractbillets
        /// returns "2021-05-30T00:00:00". Parsed by ParseVoalleDate.
        /// </summary>
        [JsonPropertyName("expirationDate")]
        public string? ExpirationDate { get; set; }

        [JsonPropertyName("typefulLine")]
        public string? TypefulLine { get; set; }

        [JsonPropertyName("pixQRCode")]
        public string? PixQRCode { get; set; }

        /// <summary>Only present on gettitlesbytxid: "Em aberto", "Paga", "Cancelada", "Vencida".</summary>
        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("amount")]
        public VoalleAmountResponse? Amount { get; set; }
    }

    private class VoalleAmountResponse
    {
        [JsonPropertyName("value")]
        public decimal Value { get; set; }

        /// <summary>Amount actually owed — includes fine, interest and discount.</summary>
        [JsonPropertyName("finalValue")]
        public decimal FinalValue { get; set; }

        [JsonPropertyName("discount")]
        public decimal Discount { get; set; }

        [JsonPropertyName("fine")]
        public decimal Fine { get; set; }

        [JsonPropertyName("interest")]
        public decimal Interest { get; set; }
    }
}
