using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Fikta.Application.Common.Interfaces;

namespace Fikta.Api.Controllers;

/// <summary>
/// Catálogo global de títulos da FIKTA.
///
/// O acervo é da plataforma, não do provedor — por isso as consultas ignoram o filtro de
/// tenant. Quais provedores recebem cada título é decidido em ProviderBooks, separadamente.
/// </summary>
[AllowAnonymous]
[Route("api/v1/catalog")]
public class CatalogController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CatalogController> _logger;

    public CatalogController(IApplicationDbContext context, ILogger<CatalogController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("books")]
    public async Task<IActionResult> ListBooks([FromQuery] string? search)
    {
        var query = _context.Books.IgnoreQueryFilters().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(b => EF.Functions.ILike(b.Title, $"%{term}%"));
        }

        var books = await query
            .OrderBy(b => b.Title)
            .Select(b => new
            {
                b.Id,
                b.Title,
                b.Isbn,
                Author = _context.Authors.IgnoreQueryFilters()
                    .Where(a => a.Id == b.AuthorId).Select(a => a.Name).FirstOrDefault(),
                Publisher = _context.Publishers.IgnoreQueryFilters()
                    .Where(p => p.Id == b.PublisherId).Select(p => p.Name).FirstOrDefault(),
                Category = _context.Categories.IgnoreQueryFilters()
                    .Where(c => c.Id == b.CategoryId).Select(c => c.Name).FirstOrDefault(),
                b.Description,
                b.CoverUrl,
                b.FileUrl,
                b.FileFormat,
                b.Status,
                b.CreatedAt,
                // Em quantos provedores o título está liberado — é o "alcance" da obra,
                // contado no banco para não depender de somar listas no frontend.
                ProviderCount = _context.ProviderBooks.IgnoreQueryFilters()
                    .Count(pb => pb.BookId == b.Id && pb.Status == "ACTIVE")
            })
            .ToListAsync();

        return Ok(new { Books = books, Total = books.Count });
    }
}
