using System;
using System.Threading.Tasks;
using Fikta.Application.Common.Models;

namespace Fikta.Application.Common.Interfaces;

public interface IEligibilityService
{
    Task<EligibilityResultDto> EvaluateCustomerAccessAsync(Guid customerId);
}
