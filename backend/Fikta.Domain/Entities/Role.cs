using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty; // e.g. SUPER_ADMIN, UNE_ADMIN, PROVIDER_ADMIN
    public string Description { get; set; } = string.Empty;

    // Relationships
    public virtual ICollection<User> Users { get; set; } = new List<User>();
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
