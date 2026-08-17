using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class Book : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Isbn { get; set; } = string.Empty;

    public Guid AuthorId { get; set; }
    public virtual Author Author { get; set; } = null!;

    public Guid PublisherId { get; set; }
    public virtual Publisher Publisher { get; set; } = null!;

    public Guid CategoryId { get; set; }
    public virtual Category Category { get; set; } = null!;

    public Guid? CollectionId { get; set; }
    public virtual Collection? Collection { get; set; }

    public Guid SupplierId { get; set; }
    public virtual Supplier Supplier { get; set; } = null!;

    public Guid LicenseId { get; set; }
    public virtual License License { get; set; } = null!;

    public string? Description { get; set; }
    public string CoverUrl { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string FileFormat { get; set; } = "EPUB"; // EPUB, PDF
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, INACTIVE

    public virtual ICollection<ProviderBook> ProviderBooks { get; set; } = new List<ProviderBook>();
}
