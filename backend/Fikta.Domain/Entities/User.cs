using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class User : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public virtual Tenant Tenant { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, SUSPENDED

    public Guid RoleId { get; set; }
    public virtual Role Role { get; set; } = null!;
}
