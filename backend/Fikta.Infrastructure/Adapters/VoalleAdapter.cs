using System;
using System.Collections.Generic;
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
            var url = BuildUrl(settings.EndpointUrl, 45715, $"/external/integrations/thirdparty/people/search?txId={document}");

            _logger.LogInformation("Querying customer by document from Voalle at URL: {Url}", url);
            var response = await client.GetAsync(url);
            
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();

            var voallePeople = await response.Content.ReadFromJsonAsync<List<VoallePersonResponse>>();
            if (voallePeople == null || voallePeople.Count == 0)
            {
                return null;
            }

            // Map the first matching person
            var person = voallePeople[0];
            var customer = new NormalizedCustomerDto
            {
                ExternalId = person.Id?.ToString() ?? string.Empty,
                Name = person.Name,
                Email = person.Email ?? string.Empty,
                Phone = person.CellPhone ?? person.Phone ?? string.Empty,
                Document = person.TxId,
                Status = person.Active ? "ACTIVE" : "INACTIVE"
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
                            Status = p.Active ? "ACTIVE" : "INACTIVE"
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
                Status = person.Active ? "ACTIVE" : "INACTIVE"
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
            var url = BuildUrl(settings.EndpointUrl, 45715, "/external/integrations/thirdparty/crm/contract-types");

            _logger.LogInformation("Querying products/contract types from Voalle at URL: {Url}", url);
            var response = await client.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var voalleProducts = await response.Content.ReadFromJsonAsync<List<VoalleProductResponse>>();
            if (voalleProducts == null)
            {
                return Array.Empty<NormalizedProductDto>();
            }

            var products = new List<NormalizedProductDto>();
            foreach (var vp in voalleProducts)
            {
                products.Add(new NormalizedProductDto
                {
                    ExternalProductId = vp.Id?.ToString() ?? string.Empty,
                    Name = vp.Name,
                    Description = vp.Description ?? string.Empty
                });
            }

            return products;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list products from Voalle");
            return Array.Empty<NormalizedProductDto>();
        }
    }

    public async Task<NormalizedFinancialDto?> GetCustomerFinancialStatusAsync(string customerExternalId, IntegrationSettings settings)
    {
        try
        {
            var client = await CreateConfiguredClientAsync(settings);
            var url = BuildUrl(settings.EndpointUrl, 45715, $"/external/integrations/thirdparty/financial/invoices?personId={customerExternalId}");

            _logger.LogInformation("Querying financial invoices from Voalle at URL: {Url}", url);
            var response = await client.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var voalleInvoices = await response.Content.ReadFromJsonAsync<List<VoalleInvoiceResponse>>();
            if (voalleInvoices == null)
            {
                return new NormalizedFinancialDto { IsDelinquent = false };
            }

            var pendingInvoices = new List<NormalizedInvoiceDto>();
            decimal overdueAmount = 0;
            int maxOverdueDays = 0;
            bool isDelinquent = false;

            var today = DateTime.UtcNow.Date;

            foreach (var vi in voalleInvoices)
            {
                if (vi.Status == "PENDING" || vi.Status == "OVERDUE")
                {
                    var isOverdue = vi.DueDate.Date < today;
                    var status = isOverdue ? "OVERDUE" : "PENDING";
                    
                    if (isOverdue)
                    {
                        isDelinquent = true;
                        overdueAmount += vi.Amount;
                        var overdueDays = (today - vi.DueDate.Date).Days;
                        if (overdueDays > maxOverdueDays)
                        {
                            maxOverdueDays = overdueDays;
                        }
                    }

                    pendingInvoices.Add(new NormalizedInvoiceDto
                    {
                        InvoiceId = vi.Id?.ToString() ?? string.Empty,
                        Amount = vi.Amount,
                        DueDate = vi.DueDate,
                        Status = status
                    });
                }
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
            _logger.LogError(ex, "Failed to check financial status for external customer {ExternalId} on Voalle", customerExternalId);
            return null;
        }
    }

    // Helper classes for parsing Voalle JSON structures
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

        [JsonPropertyName("active")]
        public bool Active { get; set; }
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

    private class VoalleProductResponse
    {
        [JsonPropertyName("id")]
        public object Id { get; set; } = null!;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }
    }

    private class VoalleInvoiceResponse
    {
        [JsonPropertyName("id")]
        public object Id { get; set; } = null!;

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("dueDate")]
        public DateTime DueDate { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty; // PENDING, OVERDUE, PAID
    }
}
