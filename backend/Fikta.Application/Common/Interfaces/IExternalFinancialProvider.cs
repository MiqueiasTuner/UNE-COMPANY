using System.Threading.Tasks;
using Fikta.Application.Common.Models;

namespace Fikta.Application.Common.Interfaces;

public interface IExternalFinancialProvider
{
    Task<NormalizedFinancialDto?> GetCustomerFinancialStatusAsync(string customerExternalId, IntegrationSettings settings);
}
