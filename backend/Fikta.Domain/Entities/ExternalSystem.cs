using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class ExternalSystem : BaseEntity
{
    public string Name { get; set; } = string.Empty; // e.g. Voalle, IXC, SGP
    public string AdapterClass { get; set; } = string.Empty; // Full class name / namespace of adapter

    // Relationships
    public virtual ICollection<Integration> Integrations { get; set; } = new List<Integration>();
}
