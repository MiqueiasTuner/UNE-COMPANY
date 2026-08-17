using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class EmailDeliveryLog : BaseEntity
{
    public Guid EmailDeliveryId { get; set; }
    public virtual EmailDelivery EmailDelivery { get; set; } = null!;

    public string LogMessage { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
