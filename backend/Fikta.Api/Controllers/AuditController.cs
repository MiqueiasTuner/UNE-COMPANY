using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fikta.Application.Common.Interfaces;
using Fikta.Domain.Entities;

namespace Fikta.Api.Controllers;

/// <summary>
/// Auditoria da plataforma: quem acessou o quê, e como andam as sincronizações com os ERPs.
///
/// Visão da FIKTA — usa <c>IgnoreQueryFilters()</c> para atravessar os filtros de tenant,
/// o que torna a autorização desta controller obrigatória antes de produção.
/// </summary>
[AllowAnonymous]
[Route("api/v1/audit")]
public class AuditController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;

    public AuditController(IApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Eventos de acesso e download, do mais recente para o mais antigo.
    /// Paginado porque esta é a tabela que mais cresce: sem limite, a tela trava
    /// no primeiro provedor com histórico real.
    /// </summary>
    [HttpGet("access-logs")]
    public async Task<IActionResult> GetAccessLogs(
        [FromQuery] Guid? providerId,
        [FromQuery] Guid? customerId,
        [FromQuery] string? eventType,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _context.AccessLogs.IgnoreQueryFilters().AsQueryable();

        if (providerId.HasValue) query = query.Where(l => l.ProviderId == providerId.Value);
        if (customerId.HasValue) query = query.Where(l => l.CustomerId == customerId.Value);
        if (!string.IsNullOrWhiteSpace(eventType)) query = query.Where(l => l.EventType == eventType);
        if (from.HasValue) query = query.Where(l => l.OccurredAt >= from.Value);
        if (to.HasValue) query = query.Where(l => l.OccurredAt <= to.Value);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(l => l.OccurredAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new
            {
                l.Id,
                l.EventType,
                l.ContentType,
                l.ContentTitle,
                l.BytesTransferred,
                l.OccurredAt,
                l.IpAddress,
                ProviderName = _context.Providers.IgnoreQueryFilters()
                    .Where(p => p.Id == l.ProviderId).Select(p => p.Name).FirstOrDefault(),
                CustomerName = _context.Customers.IgnoreQueryFilters()
                    .Where(c => c.Id == l.CustomerId).Select(c => c.Name).FirstOrDefault()
            })
            .ToListAsync();

        return Ok(new
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(total / (double)pageSize)
        });
    }

    /// <summary>
    /// Consumo consolidado por provedor num período — a base do faturamento do SVA.
    /// Tudo agregado no banco; nenhum número é estimado.
    /// </summary>
    [HttpGet("consumption")]
    public async Task<IActionResult> GetConsumption([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        // Padrão: mês corrente. Um relatório de cobrança sem período definido é
        // ambíguo demais para servir de base a qualquer conversa comercial.
        var start = from ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = to ?? start.AddMonths(1);

        var rows = await _context.AccessLogs.IgnoreQueryFilters()
            .Where(l => l.OccurredAt >= start && l.OccurredAt < end)
            .GroupBy(l => l.ProviderId)
            .Select(g => new
            {
                ProviderId = g.Key,
                TotalEvents = g.Count(),
                Downloads = g.Count(l => l.EventType.EndsWith("_DOWNLOAD")),
                Reads = g.Count(l => l.EventType.EndsWith("_READ")),
                UniqueCustomers = g.Select(l => l.CustomerId).Distinct().Count(),
                BytesTransferred = g.Sum(l => l.BytesTransferred ?? 0)
            })
            .ToListAsync();

        var providers = await _context.Providers.IgnoreQueryFilters()
            .Select(p => new { p.Id, p.Name })
            .ToListAsync();

        var result = providers.Select(p =>
        {
            var r = rows.FirstOrDefault(x => x.ProviderId == p.Id);
            return new
            {
                ProviderId = p.Id,
                p.Name,
                TotalEvents = r?.TotalEvents ?? 0,
                Downloads = r?.Downloads ?? 0,
                Reads = r?.Reads ?? 0,
                UniqueCustomers = r?.UniqueCustomers ?? 0,
                BytesTransferred = r?.BytesTransferred ?? 0
            };
        });

        return Ok(new { From = start, To = end, Providers = result });
    }

    /// <summary>Histórico de sincronizações com os ERPs.</summary>
    [HttpGet("erp-sync-logs")]
    public async Task<IActionResult> GetErpSyncLogs(
        [FromQuery] Guid? providerId,
        [FromQuery] bool? onlyFailures,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _context.ErpSyncLogs.IgnoreQueryFilters().AsQueryable();
        if (providerId.HasValue) query = query.Where(l => l.ProviderId == providerId.Value);
        if (onlyFailures == true) query = query.Where(l => !l.Success);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new
            {
                l.Id,
                l.Operation,
                l.Vendor,
                l.Subject,
                l.Endpoint,
                l.Success,
                l.HttpStatus,
                l.ErrorMessage,
                l.DurationMs,
                l.RecordCount,
                l.CreatedAt,
                ProviderName = _context.Providers.IgnoreQueryFilters()
                    .Where(p => p.Id == l.ProviderId).Select(p => p.Name).FirstOrDefault()
            })
            .ToListAsync();

        return Ok(new
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(total / (double)pageSize)
        });
    }

    /// <summary>
    /// Registra um evento de consumo. Chamado pelo próprio sistema quando o assinante
    /// baixa ou abre um conteúdo — é o que popula os relatórios acima.
    /// </summary>
    [HttpPost("access-logs")]
    public async Task<IActionResult> RecordAccess([FromBody] RecordAccessDto dto)
    {
        if (dto.CustomerId == Guid.Empty) return BadRequest(new { Error = "customerId é obrigatório." });
        if (string.IsNullOrWhiteSpace(dto.EventType)) return BadRequest(new { Error = "eventType é obrigatório." });

        var customer = await _context.Customers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == dto.CustomerId);
        if (customer == null) return NotFound(new { Error = "Assinante não encontrado." });

        _context.AccessLogs.Add(new AccessLog
        {
            // O provedor vem do assinante, nunca do corpo da requisição: aceitar um
            // providerId do cliente permitiria lançar consumo na conta de outro parceiro.
            ProviderId = customer.ProviderId,
            CustomerId = customer.Id,
            EventType = dto.EventType!,
            ContentType = string.IsNullOrWhiteSpace(dto.ContentType) ? "NONE" : dto.ContentType!,
            ContentId = dto.ContentId,
            ContentTitle = dto.ContentTitle,
            BytesTransferred = dto.BytesTransferred,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = Request.Headers.UserAgent.ToString(),
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Evento registrado." });
    }
}

public class RecordAccessDto
{
    public Guid CustomerId { get; set; }
    public string? EventType { get; set; }
    public string? ContentType { get; set; }
    public Guid? ContentId { get; set; }
    public string? ContentTitle { get; set; }
    public long? BytesTransferred { get; set; }
}
