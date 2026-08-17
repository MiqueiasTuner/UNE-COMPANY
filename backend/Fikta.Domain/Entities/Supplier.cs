using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class Supplier : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public virtual ICollection<Book> Books { get; set; } = new List<Book>();
    public virtual ICollection<License> Licenses { get; set; } = new List<License>();
}
