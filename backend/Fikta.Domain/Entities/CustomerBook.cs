using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class CustomerBook : BaseEntity, IProviderEntity
{
    public Guid ProviderId { get; set; }
    public virtual Provider Provider { get; set; } = null!;

    public Guid CustomerId { get; set; }
    public virtual Customer Customer { get; set; } = null!;

    public Guid BookId { get; set; }
    public virtual Book Book { get; set; } = null!;

    public bool IsFavorite { get; set; }
    public string Status { get; set; } = "READING"; // READING, COMPLETED, WANT_TO_READ
    public int LastPageRead { get; set; }
    public int TimeSpentSeconds { get; set; }
    public DateTime LastReadAt { get; set; } = DateTime.UtcNow;
}
