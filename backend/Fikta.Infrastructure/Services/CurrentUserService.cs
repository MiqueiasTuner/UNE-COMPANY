using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Fikta.Application.Common.Interfaces;

namespace Fikta.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? UserId => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                             ?? _httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;

    public string? Email => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value 
                            ?? _httpContextAccessor.HttpContext?.User?.FindFirst("email")?.Value;

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
