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
public class B2CController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IEligibilityService _eligibilityService;
    private readonly ICurrentUserService _currentUserService;

    public B2CController(
        IApplicationDbContext context,
        ITenantContext tenantContext,
        IEligibilityService eligibilityService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _eligibilityService = eligibilityService;
        _currentUserService = currentUserService;
    }

    private async Task<(bool success, Guid customerId, string? reason, List<Guid>? allowedCategories, List<Guid>? allowedCollections)> ValidateEligibilityAsync()
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrEmpty(_currentUserService.UserId))
        {
            return (false, Guid.Empty, "UNAUTHENTICATED", null, null);
        }

        if (!Guid.TryParse(_currentUserService.UserId, out var customerId))
        {
            return (false, Guid.Empty, "INVALID_USER_ID", null, null);
        }

        var eligibility = await _eligibilityService.EvaluateCustomerAccessAsync(customerId);
        if (!eligibility.IsEligible)
        {
            return (false, customerId, eligibility.BlockReason, null, null);
        }

        return (true, customerId, null, eligibility.AllowedCategoryIds, eligibility.AllowedCollectionIds);
    }

    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog([FromQuery] string? search, [FromQuery] Guid? categoryId)
    {
        var validation = await ValidateEligibilityAsync();
        if (!validation.success)
        {
            return BadRequest(new { Error = "NOT_ELIGIBLE", Reason = validation.reason });
        }

        var query = _context.ProviderBooks
            .Include(pb => pb.Book)
            .ThenInclude(b => b.Author)
            .Include(pb => pb.Book)
            .ThenInclude(b => b.Publisher)
            .Where(pb => pb.Status == "ACTIVE" && pb.Book.Status == "ACTIVE");

        // Apply eligibility category/collection filters
        var allowedCategories = validation.allowedCategories ?? new List<Guid>();
        var allowedCollections = validation.allowedCollections ?? new List<Guid>();

        query = query.Where(pb => allowedCategories.Contains(pb.Book.CategoryId) || 
                                 (pb.Book.CollectionId.HasValue && allowedCollections.Contains(pb.Book.CollectionId.Value)));

        // Apply dynamic query filters
        if (!string.IsNullOrWhiteSpace(search))
        {
            var cleanSearch = search.ToLower();
            query = query.Where(pb => pb.Book.Title.ToLower().Contains(cleanSearch) || 
                                     pb.Book.Author.Name.ToLower().Contains(cleanSearch));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(pb => pb.Book.CategoryId == categoryId.Value);
        }

        var results = await query.Select(pb => pb.Book).ToListAsync();
        return Ok(results);
    }

    [HttpGet("books/{bookId:guid}")]
    public async Task<IActionResult> GetBookDetails(Guid bookId)
    {
        var validation = await ValidateEligibilityAsync();
        if (!validation.success)
        {
            return BadRequest(new { Error = "NOT_ELIGIBLE", Reason = validation.reason });
        }

        var book = await _context.Books
            .Include(b => b.Author)
            .Include(b => b.Publisher)
            .FirstOrDefaultAsync(b => b.Id == bookId && b.Status == "ACTIVE");

        if (book == null)
        {
            return NotFound();
        }

        // Verify that this book is whitelisted for the provider and allowed by eligibility rules
        var allowedCategories = validation.allowedCategories ?? new List<Guid>();
        var allowedCollections = validation.allowedCollections ?? new List<Guid>();

        var isAllowed = allowedCategories.Contains(book.CategoryId) || 
                        (book.CollectionId.HasValue && allowedCollections.Contains(book.CollectionId.Value));

        if (!isAllowed)
        {
            return Forbid("Book is not included in your eligible catalog tier");
        }

        var isWhitelisted = await _context.ProviderBooks
            .AnyAsync(pb => pb.BookId == bookId && pb.Status == "ACTIVE");

        if (!isWhitelisted)
        {
            return Forbid("Book is not available for this provider");
        }

        return Ok(book);
    }

    [HttpGet("library")]
    public async Task<IActionResult> GetMyLibrary()
    {
        var validation = await ValidateEligibilityAsync();
        if (!validation.success)
        {
            return BadRequest(new { Error = "NOT_ELIGIBLE", Reason = validation.reason });
        }

        var personalLibrary = await _context.CustomerBooks
            .Include(cb => cb.Book)
            .ThenInclude(b => b.Author)
            .Where(cb => cb.CustomerId == validation.customerId)
            .ToListAsync();

        return Ok(personalLibrary);
    }

    [HttpPost("library/toggle-favorite")]
    public async Task<IActionResult> ToggleFavorite([FromBody] ToggleFavoriteDto dto)
    {
        var validation = await ValidateEligibilityAsync();
        if (!validation.success)
        {
            return BadRequest(new { Error = "NOT_ELIGIBLE", Reason = validation.reason });
        }

        var customerBook = await _context.CustomerBooks
            .FirstOrDefaultAsync(cb => cb.CustomerId == validation.customerId && cb.BookId == dto.BookId);

        if (customerBook == null)
        {
            customerBook = new CustomerBook
            {
                ProviderId = _tenantContext.ProviderId!.Value,
                CustomerId = validation.customerId,
                BookId = dto.BookId,
                IsFavorite = true,
                Status = "WANT_TO_READ"
            };
            _context.CustomerBooks.Add(customerBook);
        }
        else
        {
            customerBook.IsFavorite = !customerBook.IsFavorite;
        }

        await _context.SaveChangesAsync();
        return Ok(customerBook);
    }

    [HttpPost("library/progress")]
    public async Task<IActionResult> SaveProgress([FromBody] SaveProgressDto dto)
    {
        var validation = await ValidateEligibilityAsync();
        if (!validation.success)
        {
            return BadRequest(new { Error = "NOT_ELIGIBLE", Reason = validation.reason });
        }

        var customerBook = await _context.CustomerBooks
            .FirstOrDefaultAsync(cb => cb.CustomerId == validation.customerId && cb.BookId == dto.BookId);

        if (customerBook == null)
        {
            customerBook = new CustomerBook
            {
                ProviderId = _tenantContext.ProviderId!.Value,
                CustomerId = validation.customerId,
                BookId = dto.BookId,
                IsFavorite = false,
                Status = "READING",
                LastPageRead = dto.LastPageRead,
                TimeSpentSeconds = dto.TimeSpentSeconds,
                LastReadAt = DateTime.UtcNow
            };
            _context.CustomerBooks.Add(customerBook);
        }
        else
        {
            customerBook.LastPageRead = dto.LastPageRead;
            customerBook.TimeSpentSeconds += dto.TimeSpentSeconds;
            customerBook.LastReadAt = DateTime.UtcNow;
            if (dto.IsCompleted)
            {
                customerBook.Status = "COMPLETED";
            }
        }

        await _context.SaveChangesAsync();
        return Ok(customerBook);
    }
}

public class ToggleFavoriteDto
{
    public Guid BookId { get; set; }
}

public class SaveProgressDto
{
    public Guid BookId { get; set; }
    public int LastPageRead { get; set; }
    public int TimeSpentSeconds { get; set; }
    public bool IsCompleted { get; set; }
}
