using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class Integration : BaseEntity, IProviderEntity
{
    public Guid ProviderId { get; set; }
    public virtual Provider Provider { get; set; } = null!;

    public Guid ExternalSystemId { get; set; }
    public virtual ExternalSystem ExternalSystem { get; set; } = null!;

    public string EndpointUrl { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, INACTIVE

    // Relationships
    public virtual IntegrationCredential? Credential { get; set; }
    public virtual ICollection<ExternalProductMapping> ProductMappings { get; set; } = new List<ExternalProductMapping>();
}
