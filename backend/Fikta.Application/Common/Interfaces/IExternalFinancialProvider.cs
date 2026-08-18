using System.Threading.Tasks;
using Fikta.Application.Common.Models;

namespace Fikta.Application.Common.Interfaces;

public interface IExternalFinancialProvider
{
    /// <summary>
    /// Voalle keys its financial endpoints by CPF/CNPJ (txId), not by the internal person id,
    /// so implementations receive the customer DOCUMENT here.
    /// </summary>
    Task<NormalizedFinancialDto?> GetCustomerFinancialStatusAsync(string customerDocument, IntegrationSettings settings);
}
