using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Fikta.Application.Common.Models;
using Fikta.Application.Common.Interfaces;
using Fikta.Domain.Entities;
using Fikta.Infrastructure.Adapters;

namespace Fikta.Api.Controllers;

[AllowAnonymous]
[Route("api/v1/erp")]
public class ErpIntegrationController : ApiControllerBase
{
    private readonly VoalleAdapter _voalleAdapter;
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ErpIntegrationController> _logger;

    public ErpIntegrationController(
        VoalleAdapter voalleAdapter,
        IApplicationDbContext context,
        ITenantContext tenantContext,
        IConfiguration configuration,
        ILogger<ErpIntegrationController> logger)
    {
        _voalleAdapter = voalleAdapter;
        _context = context;
        _tenantContext = tenantContext;
        _configuration = configuration;
        _logger = logger;
    }

    private IntegrationSettings ResolveVoalleSettings(TestConnectionRequestDto? custom)
    {
        return new IntegrationSettings
        {
            EndpointUrl = !string.IsNullOrWhiteSpace(custom?.EndpointUrl) 
                ? custom.EndpointUrl 
                : _configuration["VOALLE_THIRDPARTY_BASE_URL"] ?? "https://erp.provedortechnet.com.br",
            ClientId = !string.IsNullOrWhiteSpace(custom?.ClientId) 
                ? custom.ClientId 
                : _configuration["VOALLE_THIRDPARTY_USERNAME"] ?? "19681110000194",
            ClientSecret = !string.IsNullOrWhiteSpace(custom?.ClientSecret) 
                ? custom.ClientSecret 
                : _configuration["VOALLE_THIRDPARTY_PASSWORD"] ?? "ffd8f69d40ec56e587d3268c15991cd0c1ce36e8",
            Syndata = !string.IsNullOrWhiteSpace(custom?.Syndata) 
                ? custom.Syndata 
                : _configuration["VOALLE_THIRDPARTY_SYNDATA"] ?? "TWpNMU9EYzVaakk1T0dSaU1USmxaalprWldFd00ySTFZV1JsTTJRMFptUT06WlhsS1ZHVlhOVWxpTTA0d1NXcHZhVnBZU25kWmJWRjFZMGhLZG1SdFZtdGlNMG93V2xkT2IySnRWakJNYlU1MllsTTFhV05wU1hOSmJFNDFZbXRTYVVscWIybGFSMHBzWWxoQmQwMUVZekpOUTBselNXdFNhVlpJYkhkYVUwazJTVzVDZG1NelVtNWpiVlo6U1c0d1BRPT06WlRoa01qTTFZamswWXpsaU5ETm1aRGczTURsa01qWTJZekF4TUdNM01HVT0=",
            TimeoutSeconds = 8
        };
    }

    [HttpPost("test-connection")]
    public async Task<IActionResult> TestConnection([FromBody] TestConnectionRequestDto dto)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var settings = ResolveVoalleSettings(dto);
            var products = await _voalleAdapter.ListProductsAsync(settings);
            sw.Stop();

            return Ok(new
            {
                Status = "Connected",
                LatencyMs = sw.ElapsedMilliseconds,
                ProductCount = System.Linq.Enumerable.Count(products),
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "Failed to test connection with Voalle ERP");
            return StatusCode(500, new
            {
                Status = "Error",
                Error = ex.Message,
                LatencyMs = sw.ElapsedMilliseconds,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    [HttpPost("search-customer")]
    public async Task<IActionResult> SearchCustomer([FromBody] SearchCustomerRequestDto dto)
    {
        var searchTerm = !string.IsNullOrWhiteSpace(dto.Query) ? dto.Query : dto.Document;
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return BadRequest(new { Message = "Informe o Nome, CPF/CNPJ ou Código do cliente para realizar a busca no Voalle ERP." });
        }

        var settings = ResolveVoalleSettings(null);

        try
        {
            var customers = await _voalleAdapter.SearchCustomersByNameOrTermAsync(searchTerm, settings);
            
            var results = new List<object>();
            foreach (var customer in customers)
            {
                object? financial = null;
                bool isDelinquent = false;
                try
                {
                    var f = await _voalleAdapter.GetCustomerFinancialStatusAsync(customer.ExternalId, settings);
                    financial = f;
                    isDelinquent = f?.IsDelinquent ?? false;
                }
                catch
                {
                    // Ignore financial check failure
                }

                // Contracts carry the Voalle "Catálogo de Serviços" codes (ServiceProductCodes),
                // which the frontend matches by name against the FIKTA catalog mapping to know
                // which pre-configured book collection this customer should get access to.
                var contracts = customer.Contracts;
                if (contracts == null || contracts.Count == 0)
                {
                    try
                    {
                        contracts = await _voalleAdapter.GetCustomerContractsAsync(customer.ExternalId, settings);
                    }
                    catch
                    {
                        contracts = new List<Fikta.Application.Common.Models.NormalizedContractDto>();
                    }
                }

                results.Add(new
                {
                    Customer = customer,
                    FinancialStatus = financial,
                    Contracts = contracts,
                    EligibleForAccess = customer.Status == "ACTIVE" && !isDelinquent
                });
            }

            return Ok(new
            {
                Results = results,
                TotalCount = results.Count,
                Message = results.Count > 0 
                    ? $"{results.Count} cliente(s) retornado(s) com sucesso da API do Voalle ERP." 
                    : $"Nenhum cliente retornado no Voalle ERP para o termo de busca '{searchTerm}'."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to search customer by term {SearchTerm}", searchTerm);
            return StatusCode(500, new { Error = "Falha de comunicação com a API do Voalle ERP: " + ex.Message });
        }
    }

    [HttpPost("import-customer")]
    public async Task<IActionResult> ImportCustomer([FromBody] SearchCustomerRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Document))
        {
            return BadRequest("Document (CPF/CNPJ) is required.");
        }

        var settings = ResolveVoalleSettings(null);
        var cleanDoc = dto.Document.Replace(".", "").Replace("-", "").Replace("/", "").Trim();

        try
        {
            var voalleCustomer = await _voalleAdapter.GetCustomerByDocumentAsync(cleanDoc, settings);
            if (voalleCustomer == null)
            {
                return NotFound(new { Message = $"Nenhum cliente encontrado no Voalle ERP com o documento {dto.Document}." });
            }

            var providerId = _tenantContext.ProviderId ?? Guid.NewGuid();

            var customer = new Customer
            {
                ProviderId = providerId,
                Name = voalleCustomer.Name,
                Email = string.IsNullOrEmpty(voalleCustomer.Email) ? $"{cleanDoc}@provedor.com.br" : voalleCustomer.Email,
                Document = cleanDoc,
                Status = voalleCustomer.Status == "ACTIVE" ? "ACTIVE" : "SUSPENDED"
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Cliente importado e sincronizado do ERP com sucesso!",
                Customer = customer,
                VoalleContracts = voalleCustomer.Contracts
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing customer {Document} from Voalle", dto.Document);
            return StatusCode(500, new { Error = ex.Message });
        }
    }
}

public class TestConnectionRequestDto
{
    public string? EndpointUrl { get; set; }
    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; }
    public string? Syndata { get; set; }
}

public class SearchCustomerRequestDto
{
    public string? Document { get; set; }
    public string? Query { get; set; }
}
