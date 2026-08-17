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
public class UneAdminController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IEmailService _emailService;

    public UneAdminController(IApplicationDbContext context, ITenantContext tenantContext, IEmailService emailService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _emailService = emailService;
    }

    private bool IsAuthorizedPlatformAdmin()
    {
        return _tenantContext.IsPlatformContext && 
               (_tenantContext.Role == "SUPER_ADMIN" || _tenantContext.Role == "UNE_ADMIN" || _tenantContext.Role == "UNE_OPERATOR");
    }

    [HttpPost("emails/process")]
    public async Task<IActionResult> ProcessEmails()
    {
        if (!IsAuthorizedPlatformAdmin()) return Forbid();

        await _emailService.ProcessPendingEmailsAsync();
        return Ok(new { Message = "Email processing finished successfully" });
    }

    [HttpGet("providers")]
    public async Task<IActionResult> GetProviders()
    {
        if (!IsAuthorizedPlatformAdmin()) return Forbid();

        var providers = await _context.Providers.ToListAsync();
        return Ok(providers);
    }

    [HttpPost("providers")]
    public async Task<IActionResult> CreateProvider([FromBody] CreateProviderDto dto)
    {
        if (!IsAuthorizedPlatformAdmin()) return Forbid();

        var provider = new Provider
        {
            TenantId = dto.TenantId,
            Name = dto.Name,
            CompanyName = dto.CompanyName,
            Cnpj = dto.Cnpj,
            Domain = dto.Domain,
            PrimaryColor = dto.PrimaryColor,
            SecondaryColor = dto.SecondaryColor,
            Status = "ACTIVE"
        };

        _context.Providers.Add(provider);
        await _context.SaveChangesAsync();
        return Ok(provider);
    }

    [HttpGet("books")]
    public async Task<IActionResult> GetGlobalBooks()
    {
        if (!IsAuthorizedPlatformAdmin()) return Forbid();

        var books = await _context.Books
            .Include(b => b.Author)
            .Include(b => b.Publisher)
            .ToListAsync();
        return Ok(books);
    }

    [HttpPost("books")]
    public async Task<IActionResult> CreateBook([FromBody] CreateBookDto dto)
    {
        if (!IsAuthorizedPlatformAdmin()) return Forbid();

        var book = new Book
        {
            Title = dto.Title,
            Isbn = dto.Isbn,
            AuthorId = dto.AuthorId,
            PublisherId = dto.PublisherId,
            CategoryId = dto.CategoryId,
            CollectionId = dto.CollectionId,
            SupplierId = dto.SupplierId,
            LicenseId = dto.LicenseId,
            Description = dto.Description,
            CoverUrl = dto.CoverUrl,
            FileUrl = dto.FileUrl,
            FileFormat = dto.FileFormat,
            Status = "ACTIVE"
        };

        _context.Books.Add(book);
        await _context.SaveChangesAsync();
        return Ok(book);
    }

    [HttpGet("suppliers")]
    public async Task<IActionResult> GetSuppliers()
    {
        if (!IsAuthorizedPlatformAdmin()) return Forbid();

        var suppliers = await _context.Suppliers.ToListAsync();
        return Ok(suppliers);
    }

    [HttpPost("suppliers")]
    public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierDto dto)
    {
        if (!IsAuthorizedPlatformAdmin()) return Forbid();

        var supplier = new Supplier
        {
            Name = dto.Name
        };

        _context.Suppliers.Add(supplier);
        await _context.SaveChangesAsync();
        return Ok(supplier);
    }

    [HttpGet("licenses")]
    public async Task<IActionResult> GetLicenses()
    {
        if (!IsAuthorizedPlatformAdmin()) return Forbid();

        var licenses = await _context.Licenses.Include(l => l.Supplier).ToListAsync();
        return Ok(licenses);
    }

    [HttpPost("licenses")]
    public async Task<IActionResult> CreateLicense([FromBody] CreateLicenseDto dto)
    {
        if (!IsAuthorizedPlatformAdmin()) return Forbid();

        var license = new License
        {
            SupplierId = dto.SupplierId,
            ContractNumber = dto.ContractNumber,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            MaxActivations = dto.MaxActivations
        };

        _context.Licenses.Add(license);
        await _context.SaveChangesAsync();
        return Ok(license);
    }

    [HttpPost("providers/{providerId:guid}/whitelist-book")]
    public async Task<IActionResult> WhitelistBook(Guid providerId, [FromBody] WhitelistBookDto dto)
    {
        if (!IsAuthorizedPlatformAdmin()) return Forbid();

        var exists = await _context.ProviderBooks
            .AnyAsync(pb => pb.ProviderId == providerId && pb.BookId == dto.BookId);

        if (exists) return BadRequest("Book is already whitelisted for this provider");

        var providerBook = new ProviderBook
        {
            ProviderId = providerId,
            BookId = dto.BookId,
            Status = "ACTIVE",
            AssignedAt = DateTime.UtcNow
        };

        _context.ProviderBooks.Add(providerBook);
        await _context.SaveChangesAsync();
        return Ok(providerBook);
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetGlobalReports()
    {
        if (!IsAuthorizedPlatformAdmin()) return Forbid();

        var totalProviders = await _context.Providers.CountAsync();
        var totalBooks = await _context.Books.CountAsync();
        var totalCustomers = await _context.Customers.CountAsync();

        return Ok(new
        {
            TotalProviders = totalProviders,
            TotalBooks = totalBooks,
            TotalCustomers = totalCustomers,
            Timestamp = DateTime.UtcNow
        });
    }
}

public class CreateProviderDto
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
}

public class CreateBookDto
{
    public string Title { get; set; } = string.Empty;
    public string Isbn { get; set; } = string.Empty;
    public Guid AuthorId { get; set; }
    public Guid PublisherId { get; set; }
    public Guid CategoryId { get; set; }
    public Guid? CollectionId { get; set; }
    public Guid SupplierId { get; set; }
    public Guid LicenseId { get; set; }
    public string? Description { get; set; }
    public string CoverUrl { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string FileFormat { get; set; } = "EPUB";
}

public class CreateSupplierDto
{
    public string Name { get; set; } = string.Empty;
}

public class CreateLicenseDto
{
    public Guid SupplierId { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MaxActivations { get; set; }
}

public class WhitelistBookDto
{
    public Guid BookId { get; set; }
}
