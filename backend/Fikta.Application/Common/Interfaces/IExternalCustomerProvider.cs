using System.Threading.Tasks;
using Fikta.Application.Common.Models;

namespace Fikta.Application.Common.Interfaces;

public interface IExternalCustomerProvider
{
    Task<NormalizedCustomerDto?> GetCustomerByDocumentAsync(string document, IntegrationSettings settings);
    Task<NormalizedCustomerDto?> GetCustomerByIdAsync(string externalId, IntegrationSettings settings);
}
