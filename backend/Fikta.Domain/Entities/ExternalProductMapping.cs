using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class ExternalProductMapping : BaseEntity
{
    public Guid IntegrationId { get; set; }
    public virtual Integration Integration { get; set; } = null!;

    public string ExternalProductId { get; set; } = string.Empty; // Code in the ERP
    public string InternalProductCode { get; set; } = string.Empty; // Tag in UNE Livros Core
}
