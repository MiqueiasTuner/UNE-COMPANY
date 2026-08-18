using System;
using System.Collections.Generic;
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
/// Visão global da FIKTA sobre a plataforma: quais provedores existem, quais módulos
/// cada um tem habilitado e os números consolidados.
///
/// Todo número aqui é <b>calculado a partir do banco</b> no momento da consulta. Nada é
/// constante nem estimado — um contador que não pode ser derivado simplesmente não é
/// exposto, porque um KPI errado é pior do que um KPI ausente.
/// </summary>
[AllowAnonymous]
[Route("api/v1/platform")]
public class PlatformController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<PlatformController> _logger;

    public PlatformController(IApplicationDbContext context, ILogger<PlatformController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Números globais da plataforma, todos agregados no banco.
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetGlobalStats()
    {
        // Agregações separadas e explícitas: cada card da tela corresponde a uma contagem
        // que dá para conferir em SQL. Contar em memória exigiria carregar as tabelas.
        var providerCount = await _context.Providers.IgnoreQueryFilters().CountAsync();
        var activeProviderCount = await _context.Providers.IgnoreQueryFilters().CountAsync(p => p.Status == "ACTIVE");
        var subscriberCount = await _context.Customers.IgnoreQueryFilters().CountAsync();
        var activeSubscriberCount = await _context.Customers.IgnoreQueryFilters().CountAsync(c => c.Status == "ACTIVE");
        var delinquentCount = await _context.Customers.IgnoreQueryFilters().CountAsync(c => c.IsDelinquent);
        var bookCount = await _context.Books.CountAsync(b => b.Status == "ACTIVE");
        var magazineCount = await _context.Magazines.CountAsync(m => m.Status == "PUBLISHED");

        // Soma do que está efetivamente em atraso — não é projeção nem meta.
        var overdueTotal = await _context.Customers.IgnoreQueryFilters()
            .Where(c => c.IsDelinquent)
            .SumAsync(c => (decimal?)c.OverdueAmount) ?? 0m;

        // Saúde da integração nas últimas 24 h, direto do log de sincronização.
        var since = DateTime.UtcNow.AddHours(-24);
        var syncTotal = await _context.ErpSyncLogs.IgnoreQueryFilters().CountAsync(l => l.CreatedAt >= since);
        var syncFailures = await _context.ErpSyncLogs.IgnoreQueryFilters().CountAsync(l => l.CreatedAt >= since && !l.Success);

        return Ok(new
        {
            Providers = new { Total = providerCount, Active = activeProviderCount },
            Subscribers = new
            {
                Total = subscriberCount,
                Active = activeSubscriberCount,
                Delinquent = delinquentCount,
                OverdueAmount = overdueTotal
            },
            Catalog = new { Books = bookCount, Magazines = magazineCount },
            ErpHealth = new
            {
                CallsLast24h = syncTotal,
                FailuresLast24h = syncFailures,
                // Sem chamadas não existe taxa de sucesso. Devolver 100% aqui seria
                // inventar saúde para uma integração que talvez nunca tenha rodado.
                SuccessRate = syncTotal == 0
                    ? (decimal?)null
                    : Math.Round((decimal)(syncTotal - syncFailures) * 100 / syncTotal, 1)
            },
            CalculatedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Grade de provedores × módulos — a tela de configuração global da FIKTA.
    /// Devolve todo módulo do catálogo para cada provedor, concedido ou não, para que a
    /// UI possa renderizar a matriz inteira sem adivinhar o que falta.
    /// </summary>
    [HttpGet("providers")]
    public async Task<IActionResult> GetProvidersOverview()
    {
        var modules = await _context.Modules
            .Where(m => m.Status == "ACTIVE")
            .OrderBy(m => m.SortOrder)
            .ToListAsync();

        var providers = await _context.Providers.IgnoreQueryFilters()
            .OrderBy(p => p.Name)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Cnpj,
                p.Status,
                p.PrimaryColor,
                p.SecondaryColor,
                SubscriberCount = _context.Customers.IgnoreQueryFilters().Count(c => c.ProviderId == p.Id),
                DelinquentCount = _context.Customers.IgnoreQueryFilters().Count(c => c.ProviderId == p.Id && c.IsDelinquent),
                BookCount = _context.ProviderBooks.IgnoreQueryFilters().Count(pb => pb.ProviderId == p.Id && pb.Status == "ACTIVE"),
                MagazineCount = _context.ProviderMagazines.IgnoreQueryFilters().Count(pm => pm.ProviderId == p.Id && pm.Status == "ACTIVE"),
                HasErpIntegration = _context.Integrations.IgnoreQueryFilters().Any(i => i.ProviderId == p.Id),
                LastErpSyncAt = _context.ErpSyncLogs.IgnoreQueryFilters()
                    .Where(l => l.ProviderId == p.Id && l.Success)
                    .Max(l => (DateTime?)l.CreatedAt),
                Grants = _context.ProviderModules.IgnoreQueryFilters()
                    .Where(pm => pm.ProviderId == p.Id)
                    .Select(pm => new { pm.ModuleId, pm.Enabled, pm.ExpiresAt })
                    .ToList()
            })
            .ToListAsync();

        var now = DateTime.UtcNow;

        var result = providers.Select(p => new
        {
            p.Id,
            p.Name,
            p.Cnpj,
            p.Status,
            p.PrimaryColor,
            p.SecondaryColor,
            p.SubscriberCount,
            p.DelinquentCount,
            p.BookCount,
            p.MagazineCount,
            p.HasErpIntegration,
            p.LastErpSyncAt,
            Modules = modules.Select(m =>
            {
                var grant = p.Grants.FirstOrDefault(g => g.ModuleId == m.Id);
                var expired = grant?.ExpiresAt != null && grant.ExpiresAt < now;

                return new
                {
                    m.Id,
                    m.Code,
                    m.Name,
                    m.Icon,
                    m.Surface,
                    m.RequiresErp,
                    // Três estados distintos, e não um booleano: nunca concedido,
                    // concedido e ligado, concedido e desligado/expirado.
                    Granted = grant != null,
                    Enabled = grant != null && grant.Enabled && !expired,
                    Expired = expired,
                    grant?.ExpiresAt
                };
            })
        });

        return Ok(new { Providers = result, Modules = modules.Select(m => new { m.Id, m.Code, m.Name, m.Icon, m.Surface, m.RequiresErp }) });
    }

    /// <summary>
    /// Log de sincronização com os ERPs. É o registro que responde "a integração está
    /// funcionando?" — e, quando não está, exatamente qual chamada falhou e por quê.
    /// </summary>
    [HttpGet("erp-sync-logs")]
    public async Task<IActionResult> GetErpSyncLogs([FromQuery] Guid? providerId, [FromQuery] int take = 100)
    {
        // Teto no take: sem ele, um cliente pedindo take=1000000 arrasta a tabela inteira.
        take = Math.Clamp(take, 1, 500);

        var query = _context.ErpSyncLogs.IgnoreQueryFilters().AsQueryable();
        if (providerId.HasValue) query = query.Where(l => l.ProviderId == providerId.Value);

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Take(take)
            .Select(l => new
            {
                l.Id,
                l.ProviderId,
                ProviderName = _context.Providers.IgnoreQueryFilters()
                    .Where(p => p.Id == l.ProviderId)
                    .Select(p => p.Name)
                    .FirstOrDefault(),
                l.Operation,
                l.Vendor,
                l.Subject,
                l.Endpoint,
                l.Success,
                l.HttpStatus,
                l.ErrorMessage,
                l.DurationMs,
                l.RecordCount,
                l.CreatedAt
            })
            .ToListAsync();

        var since = DateTime.UtcNow.AddHours(-24);
        var total24h = await query.CountAsync(l => l.CreatedAt >= since);
        var failed24h = await query.CountAsync(l => l.CreatedAt >= since && !l.Success);

        return Ok(new
        {
            Logs = logs,
            Summary = new
            {
                Last24h = total24h,
                Failures24h = failed24h,
                // Nulo quando não houve chamada: 100% de sucesso sobre zero chamadas
                // é uma afirmação sobre uma integração que talvez nunca tenha rodado.
                SuccessRate = total24h == 0
                    ? (decimal?)null
                    : Math.Round((decimal)(total24h - failed24h) * 100 / total24h, 1)
            }
        });
    }

    /// <summary>
    /// Trilha de acesso e download dos assinantes.
    ///
    /// Ainda não há tabela dedicada — o evento de leitura/download precisa ser registrado
    /// no momento em que o assinante abre um título, e esse fluxo depende do leitor, que
    /// não está implementado. Devolver lista vazia é o comportamento correto até lá:
    /// a tela mostra "nenhum acesso registrado", que é a verdade, em vez de dados de exemplo.
    /// </summary>
    [HttpGet("access-logs")]
    public IActionResult GetAccessLogs()
    {
        return Ok(new
        {
            Logs = Array.Empty<object>(),
            Pending = "Registro de acesso será gravado quando o leitor de conteúdo entrar em operação."
        });
    }

    /// <summary>Catálogo de módulos da plataforma.</summary>
    [HttpGet("modules")]
    public async Task<IActionResult> GetModules()
    {
        var modules = await _context.Modules
            .OrderBy(m => m.SortOrder)
            .Select(m => new
            {
                m.Id,
                m.Code,
                m.Name,
                m.Description,
                m.Icon,
                m.Surface,
                m.RequiresErp,
                m.SortOrder,
                m.Status,
                GrantedToProviders = _context.ProviderModules.IgnoreQueryFilters().Count(pm => pm.ModuleId == m.Id && pm.Enabled)
            })
            .ToListAsync();

        return Ok(new { Modules = modules, Total = modules.Count });
    }

    /// <summary>
    /// Liga ou desliga um módulo para um provedor. Idempotente: concede se ainda não
    /// existir, atualiza se já existir.
    /// </summary>
    [HttpPut("providers/{providerId:guid}/modules/{moduleCode}")]
    public async Task<IActionResult> SetProviderModule(Guid providerId, string moduleCode, [FromBody] SetModuleRequestDto dto)
    {
        var provider = await _context.Providers.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == providerId);
        if (provider == null)
        {
            return NotFound(new { Error = $"Provedor {providerId} não encontrado." });
        }

        var module = await _context.Modules.FirstOrDefaultAsync(m => m.Code == moduleCode);
        if (module == null)
        {
            return NotFound(new { Error = $"Módulo '{moduleCode}' não existe no catálogo." });
        }

        // Um módulo que depende do ERP não funciona sem integração configurada. Conceder
        // assim mesmo entregaria ao assinante uma tela que nunca carrega.
        if (module.RequiresErp && dto.Enabled)
        {
            var hasIntegration = await _context.Integrations.IgnoreQueryFilters().AnyAsync(i => i.ProviderId == providerId);
            if (!hasIntegration)
            {
                return BadRequest(new
                {
                    Error = $"O módulo '{module.Name}' depende de integração com ERP, e este provedor ainda não tem uma configurada."
                });
            }
        }

        var grant = await _context.ProviderModules.IgnoreQueryFilters()
            .FirstOrDefaultAsync(pm => pm.ProviderId == providerId && pm.ModuleId == module.Id);

        if (grant == null)
        {
            grant = new ProviderModule
            {
                ProviderId = providerId,
                ModuleId = module.Id,
                GrantedBy = User?.Identity?.Name
            };
            _context.ProviderModules.Add(grant);
        }

        grant.Enabled = dto.Enabled;
        grant.ExpiresAt = dto.ExpiresAt;
        if (dto.Settings != null) grant.Settings = dto.Settings;
        grant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Module {ModuleCode} set to {Enabled} for provider {ProviderId}",
            moduleCode, dto.Enabled, providerId);

        return Ok(new
        {
            Message = dto.Enabled
                ? $"Módulo '{module.Name}' habilitado para {provider.Name}."
                : $"Módulo '{module.Name}' desabilitado para {provider.Name}.",
            Module = new { module.Code, module.Name },
            grant.Enabled,
            grant.ExpiresAt
        });
    }

    /// <summary>
    /// Módulos ativos de um provedor — consumido pelo frontend para montar o menu e as
    /// seções do Super Portal. É a única fonte da verdade sobre o que renderizar.
    /// </summary>
    [HttpGet("providers/{providerId:guid}/modules")]
    public async Task<IActionResult> GetProviderModules(Guid providerId)
    {
        var now = DateTime.UtcNow;

        var granted = await _context.ProviderModules.IgnoreQueryFilters()
            .Where(pm => pm.ProviderId == providerId
                         && pm.Enabled
                         && (pm.ExpiresAt == null || pm.ExpiresAt > now))
            .Join(_context.Modules.Where(m => m.Status == "ACTIVE"),
                  pm => pm.ModuleId,
                  m => m.Id,
                  (pm, m) => new { Grant = pm, Module = m })
            .OrderBy(x => x.Module.SortOrder)
            .Select(x => new
            {
                x.Module.Code,
                x.Module.Name,
                x.Module.Icon,
                x.Module.Surface,
                x.Grant.Settings
            })
            .ToListAsync();

        return Ok(new { Modules = granted, Total = granted.Count });
    }
}

public class SetModuleRequestDto
{
    public bool Enabled { get; set; }
    public DateTime? ExpiresAt { get; set; }
    /// <summary>Configuração específica do módulo, em JSON.</summary>
    public string? Settings { get; set; }
}
