using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class ProviderBook : BaseEntity, IProviderEntity
{
    public Guid ProviderId { get; set; }
    public virtual Provider Provider { get; set; } = null!;

    public Guid BookId { get; set; }
    public virtual Book Book { get; set; } = null!;

    public string Status { get; set; } = "ACTIVE"; // ACTIVE, INACTIVE
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
