using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class CatalogAccessRule : BaseEntity, IProviderEntity
{
    public Guid ProviderId { get; set; }
    public virtual Provider Provider { get; set; } = null!;

    public string InternalProductCode { get; set; } = string.Empty;
    public Guid? CollectionId { get; set; }
    public Guid? CategoryId { get; set; }
    public string Description { get; set; } = string.Empty;
}
