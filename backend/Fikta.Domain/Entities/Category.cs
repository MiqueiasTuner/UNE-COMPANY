using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public virtual Category? Parent { get; set; }

    public virtual ICollection<Category> SubCategories { get; set; } = new List<Category>();
    public virtual ICollection<Book> Books { get; set; } = new List<Book>();
}
