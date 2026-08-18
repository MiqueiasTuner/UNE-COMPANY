using System;
using System.Diagnostics;
using System.Linq;
using Microsoft.EntityFrameworkCore;
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

    /// <summary>
    /// Monta as credenciais do ERP a partir da configuração, ou do que veio na requisição
    /// no caso da tela de teste de conexão.
    ///
    /// Não há valor padrão embutido de propósito. Credenciais de provedor em constante no
    /// código acabam versionadas e publicadas — foi o que aconteceu com as da TechNet, que
    /// estavam neste arquivo e no repositório do GitHub. Em desenvolvimento use user-secrets:
    ///
    ///   dotnet user-secrets set "Voalle:ThirdParty:ClientSecret" "..." --project Fikta.Api
    ///
    /// Em produção, as credenciais vêm cifradas de IntegrationCredential, por provedor.
    /// </summary>
    private IntegrationSettings ResolveVoalleSettings(TestConnectionRequestDto? custom)
    {
        string Resolve(string? fromRequest, string configKey, string legacyKey)
            => !string.IsNullOrWhiteSpace(fromRequest)
                ? fromRequest
                : _configuration[configKey] ?? _configuration[legacyKey] ?? string.Empty;

        return new IntegrationSettings
        {
            EndpointUrl = Resolve(custom?.EndpointUrl, "Voalle:ThirdParty:EndpointUrl", "VOALLE_THIRDPARTY_BASE_URL"),
            ClientId = Resolve(custom?.ClientId, "Voalle:ThirdParty:ClientId", "VOALLE_THIRDPARTY_USERNAME"),
            ClientSecret = Resolve(custom?.ClientSecret, "Voalle:ThirdParty:ClientSecret", "VOALLE_THIRDPARTY_PASSWORD"),
            Syndata = Resolve(custom?.Syndata, "Voalle:ThirdParty:Syndata", "VOALLE_THIRDPARTY_SYNDATA"),
            TimeoutSeconds = 8
        };
    }

    /// <summary>
    /// Verifica se há credenciais utilizáveis antes de chamar o ERP, para que a ausência
    /// de configuração vire uma mensagem clara em vez de um 401 confuso vindo da Voalle.
    /// </summary>
    private static string? DescribeMissingSettings(IntegrationSettings s)
    {
        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(s.EndpointUrl)) missing.Add("EndpointUrl");
        if (string.IsNullOrWhiteSpace(s.ClientId)) missing.Add("ClientId");
        if (string.IsNullOrWhiteSpace(s.ClientSecret)) missing.Add("ClientSecret");
        if (string.IsNullOrWhiteSpace(s.Syndata)) missing.Add("Syndata");

        return missing.Count == 0
            ? null
            : $"Credenciais do ERP não configuradas: {string.Join(", ", missing)}. "
              + "Defina-as via user-secrets (Voalle:ThirdParty:*) ou cadastre a integração do provedor.";
    }

    [HttpPost("test-connection")]
    public async Task<IActionResult> TestConnection([FromBody] TestConnectionRequestDto dto)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var settings = ResolveVoalleSettings(dto);
            var missing = DescribeMissingSettings(settings);
            if (missing != null) return BadRequest(new { Error = missing });
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

        var missing = DescribeMissingSettings(settings);

        if (missing != null) return BadRequest(new { Error = missing });

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
                    // Financial endpoints are keyed by CPF/CNPJ, not by the internal person id.
                    var f = await _voalleAdapter.GetCustomerFinancialStatusAsync(customer.Document, settings);
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

    /// <summary>
    /// Imports (or refreshes) a subscriber from the provider's ERP and mirrors their open
    /// invoices locally, so the B2C portal and the eligibility guard can answer without
    /// touching the ERP on every request.
    ///
    /// Idempotent: calling it twice for the same document updates the existing row rather
    /// than creating a twin — (ProviderId, Document) is unique.
    /// </summary>
    [HttpPost("import-customer")]
    public async Task<IActionResult> ImportCustomer([FromBody] ImportCustomerRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Document))
        {
            return BadRequest(new { Error = "Documento (CPF/CNPJ) é obrigatório." });
        }

        // The provider must be a real, existing row. Inventing a Guid here (as an earlier
        // version did) silently produces customers attached to a provider that does not exist.
        var providerId = _tenantContext.ProviderId ?? dto.ProviderId;
        if (providerId == null || providerId == Guid.Empty)
        {
            return BadRequest(new { Error = "Provedor não identificado. Informe providerId ou autentique-se em um tenant." });
        }

        var provider = await _context.Providers.FirstOrDefaultAsync(p => p.Id == providerId.Value);
        if (provider == null)
        {
            return NotFound(new { Error = $"Provedor {providerId} não encontrado." });
        }

        var settings = ResolveVoalleSettings(null);

        var missing = DescribeMissingSettings(settings);

        if (missing != null) return BadRequest(new { Error = missing });
        var cleanDoc = OnlyDigits(dto.Document);
        var stopwatch = Stopwatch.StartNew();

        try
        {
            var voalleCustomer = await _voalleAdapter.GetCustomerByDocumentAsync(cleanDoc, settings);

            if (voalleCustomer == null)
            {
                await LogSyncAsync(providerId.Value, "CUSTOMER_LOOKUP", cleanDoc,
                    $"/people/txid/{cleanDoc}", success: true, stopwatch, recordCount: 0);

                return NotFound(new { Message = $"Nenhum cliente encontrado no ERP com o documento {dto.Document}." });
            }

            var customer = await UpsertCustomerAsync(providerId.Value, cleanDoc, voalleCustomer);
            var invoiceResult = await SyncInvoicesAsync(providerId.Value, customer, cleanDoc, settings);

            await _context.SaveChangesAsync();

            await LogSyncAsync(providerId.Value, "CUSTOMER_LOOKUP", cleanDoc,
                $"/people/txid/{cleanDoc}", success: true, stopwatch, recordCount: 1);

            return Ok(new
            {
                Message = "Cliente importado e sincronizado do ERP com sucesso.",
                Customer = new
                {
                    customer.Id,
                    customer.Name,
                    customer.Email,
                    customer.Phone,
                    customer.Document,
                    customer.ExternalId,
                    customer.Status,
                    customer.IsDelinquent,
                    customer.OverdueDays,
                    customer.OverdueAmount,
                    customer.SyncedAt
                },
                Invoices = invoiceResult,
                VoalleContracts = voalleCustomer.Contracts
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing customer {Document} from Voalle", dto.Document);

            await LogSyncAsync(providerId.Value, "CUSTOMER_LOOKUP", cleanDoc,
                $"/people/txid/{cleanDoc}", success: false, stopwatch, recordCount: null, error: ex.Message);

            return StatusCode(500, new { Error = "Falha ao consultar o ERP: " + ex.Message });
        }
    }

    /// <summary>Creates the subscriber or refreshes the existing row from ERP data.</summary>
    private async Task<Customer> UpsertCustomerAsync(Guid providerId, string document, NormalizedCustomerDto source)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.ProviderId == providerId && c.Document == document);

        if (customer == null)
        {
            customer = new Customer
            {
                ProviderId = providerId,
                Document = document,
                // Placeholder only when the ERP has no e-mail: the column is unique per
                // provider, so two blank e-mails would collide on insert.
                Email = string.IsNullOrWhiteSpace(source.Email) ? $"{document}@sem-email.local" : source.Email
            };
            _context.Customers.Add(customer);
        }
        else if (!string.IsNullOrWhiteSpace(source.Email))
        {
            customer.Email = source.Email;
        }

        customer.Name = source.Name;
        customer.Phone = source.Phone;
        customer.ExternalId = source.ExternalId;
        customer.Status = source.Status == "ACTIVE" ? "ACTIVE" : "SUSPENDED";
        customer.SyncSource = "ERP_VOALLE";
        customer.SyncedAt = DateTime.UtcNow;
        customer.UpdatedAt = DateTime.UtcNow;

        return customer;
    }

    /// <summary>
    /// Mirrors the subscriber's open invoices and recomputes the delinquency verdict.
    ///
    /// `getopentitlesbytxid` returns only what is still open, so an invoice that vanishes
    /// has been settled or cancelled. Those rows are marked, never deleted — the history is
    /// what lets support explain a past block.
    /// </summary>
    private async Task<object> SyncInvoicesAsync(Guid providerId, Customer customer, string document, IntegrationSettings settings)
    {
        var stopwatch = Stopwatch.StartNew();

        var financial = await _voalleAdapter.GetCustomerFinancialStatusAsync(document, settings);
        if (financial == null)
        {
            await LogSyncAsync(providerId, "INVOICE_SYNC", document,
                $"/getopentitlesbytxid/{document}", success: false, stopwatch, recordCount: null,
                error: "ERP não retornou situação financeira");

            // Leave the previous verdict untouched: a failing ERP must not turn into
            // a wave of subscribers losing access.
            return new { Synced = 0, Warning = "Não foi possível sincronizar faturas; veredito anterior mantido." };
        }

        var existing = await _context.CustomerInvoices
            .Where(i => i.CustomerId == customer.Id)
            .ToListAsync();

        var seenExternalIds = new HashSet<string>();
        var now = DateTime.UtcNow;

        foreach (var incoming in financial.PendingInvoices)
        {
            if (string.IsNullOrWhiteSpace(incoming.InvoiceId)) continue;
            seenExternalIds.Add(incoming.InvoiceId);

            var invoice = existing.FirstOrDefault(i => i.ExternalId == incoming.InvoiceId);
            if (invoice == null)
            {
                invoice = new CustomerInvoice
                {
                    ProviderId = providerId,
                    CustomerId = customer.Id,
                    ExternalId = incoming.InvoiceId
                };
                _context.CustomerInvoices.Add(invoice);
            }

            invoice.Amount = incoming.Amount;
            invoice.DueDate = incoming.DueDate;
            invoice.Status = incoming.Status == "OVERDUE" ? "OVERDUE" : "OPEN";
            invoice.SyncedAt = now;
            invoice.DisappearedFromErpAt = null;
            invoice.UpdatedAt = now;
        }

        // Anything we had that the ERP no longer lists is settled or cancelled.
        var settled = 0;
        foreach (var stale in existing.Where(i => !seenExternalIds.Contains(i.ExternalId)))
        {
            if (stale.Status == "PAID_OR_REMOVED") continue;
            stale.Status = "PAID_OR_REMOVED";
            stale.DisappearedFromErpAt = now;
            stale.UpdatedAt = now;
            settled++;
        }

        // Materialise the verdict so the reading guard never calls the ERP.
        customer.IsDelinquent = financial.IsDelinquent;
        customer.OverdueDays = financial.OverdueDays;
        customer.OverdueAmount = financial.OverdueAmount;
        customer.EligibilityCheckedAt = now;

        await LogSyncAsync(providerId, "INVOICE_SYNC", document,
            $"/getopentitlesbytxid/{document}", success: true, stopwatch,
            recordCount: financial.PendingInvoices.Count);

        return new
        {
            Synced = financial.PendingInvoices.Count,
            Settled = settled,
            customer.IsDelinquent,
            customer.OverdueDays,
            customer.OverdueAmount
        };
    }

    /// <summary>
    /// Records one ERP round trip. Written on its own DbContext save path so a failed
    /// business transaction still leaves the audit trail behind.
    /// </summary>
    private async Task LogSyncAsync(Guid providerId, string operation, string? subject, string? endpoint,
        bool success, Stopwatch stopwatch, int? recordCount, string? error = null)
    {
        stopwatch.Stop();

        _context.ErpSyncLogs.Add(new ErpSyncLog
        {
            ProviderId = providerId,
            Operation = operation,
            Vendor = "VOALLE",
            Subject = subject,
            Endpoint = endpoint,
            Success = success,
            DurationMs = (int)stopwatch.ElapsedMilliseconds,
            RecordCount = recordCount,
            ErrorMessage = error
        });

        await _context.SaveChangesAsync();
    }

    private static string OnlyDigits(string value)
        => string.IsNullOrEmpty(value) ? string.Empty : new string(value.Where(char.IsDigit).ToArray());
}

public class TestConnectionRequestDto
{
    public string? EndpointUrl { get; set; }
    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; }
    public string? Syndata { get; set; }
}

public class ImportCustomerRequestDto : SearchCustomerRequestDto
{
    /// <summary>Required when the request is not already scoped to a tenant.</summary>
    public Guid? ProviderId { get; set; }
}

public class SearchCustomerRequestDto
{
    public string? Document { get; set; }
    public string? Query { get; set; }
}
