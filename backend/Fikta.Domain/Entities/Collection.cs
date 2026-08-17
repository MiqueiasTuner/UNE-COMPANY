using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class Collection : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public virtual ICollection<Book> Books { get; set; } = new List<Book>();
}
