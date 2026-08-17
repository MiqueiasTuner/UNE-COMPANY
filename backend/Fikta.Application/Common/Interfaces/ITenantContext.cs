using System;

namespace Fikta.Application.Common.Interfaces;

public interface ITenantContext
{
    Guid? TenantId { get; }
    Guid? ProviderId { get; }
    string? Role { get; }
    bool IsPlatformContext { get; }
}
