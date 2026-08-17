using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class EmailDelivery : BaseEntity, IProviderEntity
{
    public Guid ProviderId { get; set; }
    public virtual Provider Provider { get; set; } = null!;

    public Guid? CustomerId { get; set; }
    public virtual Customer? Customer { get; set; }

    public string ToAddress { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING"; // PENDING, SENT, FAILED
    public DateTime? SentAt { get; set; }
    public int Attempts { get; set; }

    public virtual ICollection<EmailDeliveryLog> Logs { get; set; } = new List<EmailDeliveryLog>();
}
