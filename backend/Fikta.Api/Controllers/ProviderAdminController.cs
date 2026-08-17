using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fikta.Application.Common.Interfaces;
using Fikta.Domain.Entities;

namespace Fikta.Api.Controllers;

[Authorize]
public class ProviderAdminController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IEncryptionService _encryptionService;

    public ProviderAdminController(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        IEncryptionService encryptionService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _encryptionService = encryptionService;
    }

    private bool IsAuthorizedProviderAdmin()
    {
        return !_tenantContext.IsPlatformContext && 
               _tenantContext.ProviderId.HasValue &&
               (_tenantContext.Role == "PROVIDER_ADMIN" || _tenantContext.Role == "PROVIDER_OPERATOR");
    }

    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers()
    {
        if (!IsAuthorizedProviderAdmin()) return Forbid();

        var customers = await _context.Customers.ToListAsync();
        return Ok(customers);
    }

    [HttpPost("customers")]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerDto dto)
    {
        if (!IsAuthorizedProviderAdmin()) return Forbid();

        var customer = new Customer
        {
            ProviderId = _tenantContext.ProviderId!.Value,
            Name = dto.Name,
            Email = dto.Email,
            Document = dto.Document,
            Status = "ACTIVE"
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();
        return Ok(customer);
    }

    [HttpGet("catalog")]
    public async Task<IActionResult> GetProviderCatalog()
    {
        if (!IsAuthorizedProviderAdmin()) return Forbid();

        var catalog = await _context.ProviderBooks
            .Include(pb => pb.Book)
            .ToListAsync();
        return Ok(catalog);
    }

    [HttpPost("catalog/toggle")]
    public async Task<IActionResult> ToggleBookStatus([FromBody] ToggleBookStatusDto dto)
    {
        if (!IsAuthorizedProviderAdmin()) return Forbid();

        var providerBook = await _context.ProviderBooks
            .FirstOrDefaultAsync(pb => pb.BookId == dto.BookId);

        if (providerBook == null) return NotFound("Book is not whitelisted for this provider");

        providerBook.Status = dto.Status;
        await _context.SaveChangesAsync();
        return Ok(providerBook);
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        if (!IsAuthorizedProviderAdmin()) return Forbid();

        var provider = await _context.Providers
            .FirstOrDefaultAsync(p => p.Id == _tenantContext.ProviderId!.Value);

        if (provider == null) return NotFound("Provider not found");

        return Ok(new
        {
            provider.Name,
            provider.CompanyName,
            provider.Cnpj,
            provider.Domain,
            provider.PrimaryColor,
            provider.SecondaryColor,
            provider.Settings
        });
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateProviderSettingsDto dto)
    {
        if (!IsAuthorizedProviderAdmin()) return Forbid();

        var provider = await _context.Providers
            .FirstOrDefaultAsync(p => p.Id == _tenantContext.ProviderId!.Value);

        if (provider == null) return NotFound("Provider not found");

        provider.PrimaryColor = dto.PrimaryColor;
        provider.SecondaryColor = dto.SecondaryColor;
        provider.Settings = dto.SettingsJson;

        await _context.SaveChangesAsync();
        return Ok(provider);
    }

    [HttpGet("integrations")]
    public async Task<IActionResult> GetIntegrations()
    {
        if (!IsAuthorizedProviderAdmin()) return Forbid();

        var integrations = await _context.Integrations
            .Include(i => i.Credential)
            .ToListAsync();

        var result = integrations.Select(i => new
        {
            i.Id,
            i.ExternalSystemId,
            i.EndpointUrl,
            i.Status,
            HasCredentials = i.Credential != null
        });

        return Ok(result);
    }

    [HttpPost("integrations")]
    public async Task<IActionResult> ConfigureIntegration([FromBody] ConfigureIntegrationDto dto)
    {
        if (!IsAuthorizedProviderAdmin()) return Forbid();

        var integration = await _context.Integrations
            .Include(i => i.Credential)
            .FirstOrDefaultAsync(i => i.ExternalSystemId == dto.ExternalSystemId);

        if (integration == null)
        {
            integration = new Integration
            {
                ProviderId = _tenantContext.ProviderId!.Value,
                ExternalSystemId = dto.ExternalSystemId,
                EndpointUrl = dto.EndpointUrl,
                Status = "ACTIVE"
            };
            _context.Integrations.Add(integration);
        }
        else
        {
            integration.EndpointUrl = dto.EndpointUrl;
            integration.Status = "ACTIVE";
        }

        var encryptedClientId = _encryptionService.Encrypt(dto.ClientId);
        var encryptedClientSecret = _encryptionService.Encrypt(dto.ClientSecret);
        var encryptedSyndata = !string.IsNullOrEmpty(dto.Syndata) ? _encryptionService.Encrypt(dto.Syndata) : null;

        if (integration.Credential == null)
        {
            integration.Credential = new IntegrationCredential
            {
                EncryptedClientId = encryptedClientId,
                EncryptedClientSecret = encryptedClientSecret,
                EncryptedSyndata = encryptedSyndata
            };
        }
        else
        {
            integration.Credential.EncryptedClientId = encryptedClientId;
            integration.Credential.EncryptedClientSecret = encryptedClientSecret;
            integration.Credential.EncryptedSyndata = encryptedSyndata;
        }

        await _context.SaveChangesAsync();
        return Ok(new { integration.Id, integration.EndpointUrl, integration.Status });
    }
}

public class CreateCustomerDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Document { get; set; } = string.Empty;
}

public class ToggleBookStatusDto
{
    public Guid BookId { get; set; }
    public string Status { get; set; } = "ACTIVE";
}

public class UpdateProviderSettingsDto
{
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? SettingsJson { get; set; }
}

public class ConfigureIntegrationDto
{
    public Guid ExternalSystemId { get; set; }
    public string EndpointUrl { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string? Syndata { get; set; }
}
