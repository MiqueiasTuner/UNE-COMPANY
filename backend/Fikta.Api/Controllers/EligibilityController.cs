using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Fikta.Application.Common.Interfaces;

namespace Fikta.Api.Controllers;

public class EligibilityController : ApiControllerBase
{
    private readonly IEligibilityService _eligibilityService;
    private readonly ICurrentUserService _currentUserService;

    public EligibilityController(IEligibilityService eligibilityService, ICurrentUserService currentUserService)
    {
        _eligibilityService = eligibilityService;
        _currentUserService = currentUserService;
    }

    [HttpGet("check")]
    public async Task<IActionResult> CheckCurrentCustomerEligibility()
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrEmpty(_currentUserService.UserId))
        {
            return Unauthorized("User is not authenticated");
        }

        if (!Guid.TryParse(_currentUserService.UserId, out var customerId))
        {
            return BadRequest("Invalid user ID claims");
        }

        var result = await _eligibilityService.EvaluateCustomerAccessAsync(customerId);
        return Ok(result);
    }

    [HttpGet("check/{customerId:guid}")]
    public async Task<IActionResult> CheckCustomerEligibilityById(Guid customerId)
    {
        var result = await _eligibilityService.EvaluateCustomerAccessAsync(customerId);
        return Ok(result);
    }
}
