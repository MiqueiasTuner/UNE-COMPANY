using System.Collections.Generic;
using System.Threading.Tasks;
using Fikta.Application.Common.Models;

namespace Fikta.Application.Common.Interfaces;

public interface IExternalProductProvider
{
    Task<IEnumerable<NormalizedProductDto>> ListProductsAsync(IntegrationSettings settings);
}
