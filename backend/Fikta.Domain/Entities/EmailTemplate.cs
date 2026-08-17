using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class EmailTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string SubjectTemplate { get; set; } = string.Empty;
    public string BodyTemplate { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE";
}
