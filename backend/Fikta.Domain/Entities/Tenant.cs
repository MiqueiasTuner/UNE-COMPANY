using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Type { get; set; } = "PROVIDER"; // PLATFORM, PROVIDER
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, SUSPENDED

    // Relationships
    public virtual ICollection<Provider> Providers { get; set; } = new List<Provider>();
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
