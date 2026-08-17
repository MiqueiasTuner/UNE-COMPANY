using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Fikta.Application.Common.Interfaces;

namespace Fikta.Infrastructure.Services;

public class TenantContext : ITenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? TenantId
    {
        get
        {
            var tenantClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("tenant_id")?.Value;
            return Guid.TryParse(tenantClaim, out var tenantId) ? tenantId : null;
        }
    }

    public Guid? ProviderId
    {
        get
        {
            var providerClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("provider_id")?.Value;
            return Guid.TryParse(providerClaim, out var providerId) ? providerId : null;
        }
    }

    public string? Role => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value 
                            ?? _httpContextAccessor.HttpContext?.User?.FindFirst("role")?.Value;

    public bool IsPlatformContext => Role == "SUPER_ADMIN" || Role == "UNE_ADMIN" || Role == "UNE_OPERATOR";
}
