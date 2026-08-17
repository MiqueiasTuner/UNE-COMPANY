using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class Permission : BaseEntity
{
    public string Name { get; set; } = string.Empty; // e.g. read:books, write:books
    public string Description { get; set; } = string.Empty;

    // Relationships
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
