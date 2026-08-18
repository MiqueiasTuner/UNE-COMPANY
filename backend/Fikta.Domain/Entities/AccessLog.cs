using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

/// <summary>
/// Registro de consumo de conteúdo por assinante.
///
/// É a base de três coisas que a plataforma não consegue responder sem ela: quanto a FIKTA
/// fatura de cada provedor, quais títulos justificam o custo de licenciamento, e o que um
/// assinante específico acessou quando há disputa sobre cobrança ou direito autoral.
///
/// Uma linha por evento, nunca agregada na escrita: totais podem ser recalculados a partir
/// dos eventos, mas eventos perdidos não voltam de um total.
/// </summary>
public class AccessLog : BaseEntity, IProviderEntity
{
    public Guid ProviderId { get; set; }
    public virtual Provider Provider { get; set; } = null!;

    public Guid CustomerId { get; set; }
    public virtual Customer Customer { get; set; } = null!;

    /// <summary>
    /// O que aconteceu: BOOK_DOWNLOAD, BOOK_READ, MAGAZINE_DOWNLOAD, MAGAZINE_READ,
    /// BILLET_DOWNLOAD, LOGIN. Guardado como texto para que um evento novo não exija
    /// migration nem invalide o histórico já gravado.
    /// </summary>
    public string EventType { get; set; } = string.Empty;

    /// <summary>Tipo do conteúdo: BOOK, MAGAZINE, BILLET, NONE.</summary>
    public string ContentType { get; set; } = "NONE";

    /// <summary>Id do livro ou revista acessado. Nulo em eventos sem conteúdo, como LOGIN.</summary>
    public Guid? ContentId { get; set; }

    /// <summary>
    /// Título no momento do acesso. Duplica o nome de propósito: se a obra for removida
    /// do catálogo, o relatório de consumo do mês passado continua legível.
    /// </summary>
    public string? ContentTitle { get; set; }

    /// <summary>Bytes transferidos, quando o evento é download. Alimenta o tráfego por provedor.</summary>
    public long? BytesTransferred { get; set; }

    /// <summary>
    /// IP de origem. É dado pessoal sob a LGPD — existe para investigar abuso de
    /// compartilhamento de conta, e deve ser expurgado junto com o restante do log.
    /// </summary>
    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    /// <summary>Momento do evento, separado de CreatedAt para tolerar ingestão em lote.</summary>
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}
