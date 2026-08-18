using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Fikta.Application.Common.Interfaces;
using Fikta.Domain.Entities;

namespace Fikta.Api.Controllers;

/// <summary>
/// Gestão de provedores parceiros pela FIKTA (visão master).
///
/// Todas as consultas usam <c>IgnoreQueryFilters()</c> de propósito: o filtro global de
/// multi-tenancy existe para impedir que um provedor veja o outro, mas esta controller
/// É a visão global da plataforma — sem ignorá-lo, a FIKTA não enxerga provedor nenhum.
///
/// Isso torna a autorização desta controller obrigatória. Enquanto o login real não
/// existe ela está [AllowAnonymous] para o ambiente de desenvolvimento; ao ligar a
/// autenticação, restringir a UNE_ADMIN/SUPER_ADMIN é condição para ir a produção.
/// </summary>
[AllowAnonymous]
[Route("api/v1/providers")]
public class ProvidersController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ProvidersController> _logger;

    public ProvidersController(IApplicationDbContext context, ILogger<ProvidersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>Lista os provedores com as contagens agregadas no banco.</summary>
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var providers = await _context.Providers
            .IgnoreQueryFilters()
            .OrderBy(p => p.Name)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.CompanyName,
                p.Cnpj,
                p.Status,
                p.Domain,
                p.PrimaryColor,
                p.SecondaryColor,
                p.CreatedAt,
                SubscriberCount = _context.Customers.IgnoreQueryFilters().Count(c => c.ProviderId == p.Id),
                HasErpIntegration = _context.Integrations.IgnoreQueryFilters().Any(i => i.ProviderId == p.Id),
                ModuleCount = _context.ProviderModules.IgnoreQueryFilters().Count(pm => pm.ProviderId == p.Id && pm.Enabled)
            })
            .ToListAsync();

        return Ok(new { Providers = providers, Total = providers.Count });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var provider = await _context.Providers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (provider == null) return NotFound(new { Error = $"Provedor {id} não encontrado." });

        return Ok(new
        {
            provider.Id,
            provider.Name,
            provider.CompanyName,
            provider.Cnpj,
            provider.Status,
            provider.Domain,
            provider.PrimaryColor,
            provider.SecondaryColor,
            provider.CreatedAt
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProviderRequestDto dto)
    {
        var error = Validate(dto);
        if (error != null) return BadRequest(new { Error = error });

        // NULL, e não string vazia: o índice único é filtrado por "Cnpj IS NOT NULL", então
        // gravar "" faria todo provedor sem documento colidir com o primeiro cadastrado
        // sem documento — que foi exatamente o que aconteceu.
        var cnpj = NormalizeCnpj(dto.Cnpj);

        // Cnpj e Domain têm índice único: barrar aqui devolve uma mensagem legível
        // em vez de estourar uma DbUpdateException genérica no SaveChanges.
        if (cnpj != null && await _context.Providers.IgnoreQueryFilters().AnyAsync(p => p.Cnpj == cnpj))
        {
            return Conflict(new { Error = $"Já existe um provedor com o CNPJ {dto.Cnpj}." });
        }

        var domain = BuildDomain(dto);
        if (await _context.Providers.IgnoreQueryFilters().AnyAsync(p => p.Domain == domain))
        {
            return Conflict(new { Error = $"O domínio '{domain}' já está em uso por outro provedor." });
        }

        var tenant = await ResolveProviderTenantAsync();

        var provider = new Provider
        {
            TenantId = tenant.Id,
            Name = dto.Name!.Trim(),
            CompanyName = string.IsNullOrWhiteSpace(dto.CompanyName) ? dto.Name!.Trim() : dto.CompanyName!.Trim(),
            Cnpj = cnpj,
            Domain = domain,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "ACTIVE" : dto.Status!,
            PrimaryColor = dto.PrimaryColor,
            SecondaryColor = dto.SecondaryColor
        };

        _context.Providers.Add(provider);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Provider {Name} ({Cnpj}) created with id {Id}", provider.Name, provider.Cnpj, provider.Id);

        return Ok(new
        {
            Message = $"Provedor {provider.Name} cadastrado.",
            Provider = new { provider.Id, provider.Name, provider.Cnpj, provider.Domain, provider.Status }
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ProviderRequestDto dto)
    {
        var provider = await _context.Providers.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id);
        if (provider == null) return NotFound(new { Error = $"Provedor {id} não encontrado." });

        var error = Validate(dto);
        if (error != null) return BadRequest(new { Error = error });

        var cnpj = NormalizeCnpj(dto.Cnpj);
        if (cnpj != null && await _context.Providers.IgnoreQueryFilters().AnyAsync(p => p.Cnpj == cnpj && p.Id != id))
        {
            return Conflict(new { Error = $"O CNPJ {dto.Cnpj} já pertence a outro provedor." });
        }

        provider.Name = dto.Name!.Trim();
        provider.CompanyName = string.IsNullOrWhiteSpace(dto.CompanyName) ? provider.CompanyName : dto.CompanyName!.Trim();
        provider.Cnpj = cnpj;
        if (!string.IsNullOrWhiteSpace(dto.Status)) provider.Status = dto.Status!;
        if (dto.PrimaryColor != null) provider.PrimaryColor = dto.PrimaryColor;
        if (dto.SecondaryColor != null) provider.SecondaryColor = dto.SecondaryColor;
        provider.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { Message = $"Provedor {provider.Name} atualizado.", Provider = new { provider.Id, provider.Name, provider.Cnpj, provider.Status } });
    }

    /// <summary>
    /// Devolve apenas os dígitos, ou <c>null</c> quando não há CNPJ informado.
    /// Nunca string vazia — ver o comentário no Create sobre o índice único filtrado.
    /// </summary>
    private static string? NormalizeCnpj(string? value)
    {
        var digits = OnlyDigits(value ?? string.Empty);
        return string.IsNullOrEmpty(digits) ? null : digits;
    }

    private static string? Validate(ProviderRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return "Nome do provedor é obrigatório.";

        // CNPJ é opcional. Se vier, precisa ter o tamanho certo; se não vier, o provedor
        // é cadastrado sem documento e a pendência fica visível na listagem.
        if (!string.IsNullOrWhiteSpace(dto.Cnpj) && OnlyDigits(dto.Cnpj).Length != 14)
        {
            return "CNPJ deve conter 14 dígitos.";
        }

        return null;
    }

    /// <summary>
    /// Todo provedor pertence a um tenant. Enquanto o cadastro de tenants não é exposto
    /// na interface, reaproveitamos (ou criamos) o tenant do tipo PROVIDER, para que o
    /// operador não precise conhecer um conceito que a tela ainda não mostra.
    /// </summary>
    private async Task<Tenant> ResolveProviderTenantAsync()
    {
        var tenant = await _context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Type == "PROVIDER");

        if (tenant != null) return tenant;

        tenant = new Tenant { Type = "PROVIDER", Status = "ACTIVE" };
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();
        return tenant;
    }

    /// <summary>Slug estável usado como subdomínio white label.</summary>
    private static string BuildDomain(ProviderRequestDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.Domain)) return dto.Domain!.Trim().ToLowerInvariant();

        var slug = new string(
            dto.Name!.ToLowerInvariant()
                .Replace('á', 'a').Replace('ã', 'a').Replace('â', 'a')
                .Replace('é', 'e').Replace('ê', 'e')
                .Replace('í', 'i').Replace('ó', 'o').Replace('ô', 'o')
                .Replace('ú', 'u').Replace('ç', 'c')
                .Where(c => char.IsLetterOrDigit(c) || c == ' ')
                .ToArray())
            .Trim()
            .Replace(" ", "-");

        return string.IsNullOrWhiteSpace(slug) ? Guid.NewGuid().ToString("n")[..8] : slug;
    }

    private static string OnlyDigits(string value)
        => string.IsNullOrEmpty(value) ? string.Empty : new string(value.Where(char.IsDigit).ToArray());
}

public class ProviderRequestDto
{
    public string? Name { get; set; }
    public string? CompanyName { get; set; }
    public string? Cnpj { get; set; }
    public string? Domain { get; set; }
    public string? Status { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
}
