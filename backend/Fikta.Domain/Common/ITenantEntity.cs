using System;

namespace Fikta.Domain.Common;

public interface ITenantEntity
{
    Guid TenantId { get; set; }
}
