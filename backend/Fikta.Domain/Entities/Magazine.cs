using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

/// <summary>
/// Edição de revista do catálogo global da FIKTA.
///
/// Diferente de <see cref="Book"/>, uma revista é periódica: o que identifica a edição
/// é a competência (mês/ano), e o assinante espera "a edição de agosto", não um título
/// avulso. Por isso competência é campo próprio e indexado, não texto livre.
///
/// A revista nasce na FIKTA e só chega ao assinante se a FIKTA a disponibilizar ao
/// provedor dele — ver <see cref="ProviderMagazine"/>.
/// </summary>
public class Magazine : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public Guid? PublisherId { get; set; }
    public virtual Publisher? Publisher { get; set; }

    public Guid? CategoryId { get; set; }
    public virtual Category? Category { get; set; }

    /// <summary>Ano da edição, ex.: 2026.</summary>
    public int Year { get; set; }

    /// <summary>Mês da edição, 1–12. Junto com <see cref="Year"/> forma a competência.</summary>
    public int Month { get; set; }

    public string? Description { get; set; }

    public string CoverUrl { get; set; } = string.Empty;

    public string FileUrl { get; set; } = string.Empty;

    public string FileFormat { get; set; } = "PDF"; // PDF, EPUB

    /// <summary>
    /// Data a partir da qual a edição pode ser lida. Permite subir a edição antes da
    /// virada do mês sem expô-la ao assinante.
    /// </summary>
    public DateTime? PublishedAt { get; set; }

    public string Status { get; set; } = "DRAFT"; // DRAFT, PUBLISHED, ARCHIVED

    public virtual ICollection<ProviderMagazine> ProviderMagazines { get; set; } = new List<ProviderMagazine>();
}
