using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class License : BaseEntity
{
    public Guid SupplierId { get; set; }
    public virtual Supplier Supplier { get; set; } = null!;

    public string ContractNumber { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MaxActivations { get; set; }

    public virtual ICollection<Book> Books { get; set; } = new List<Book>();
}
