using Microsoft.AspNetCore.Mvc;
using Fikta.Application.Common.Interfaces;

namespace Fikta.Api.Controllers;

public class TestContextController : ApiControllerBase
{
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public TestContextController(ITenantContext tenantContext, ICurrentUserService currentUserService)
    {
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public IActionResult GetCurrentContext()
    {
        return Ok(new
        {
            IsAuthenticated = _currentUserService.IsAuthenticated,
            UserId = _currentUserService.UserId,
            Email = _currentUserService.Email,
            TenantId = _tenantContext.TenantId,
            ProviderId = _tenantContext.ProviderId,
            Role = _tenantContext.Role,
            IsPlatformContext = _tenantContext.IsPlatformContext
        });
    }
}
