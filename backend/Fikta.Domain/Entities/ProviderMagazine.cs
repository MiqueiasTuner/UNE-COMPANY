using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

/// <summary>
/// Disponibilização de uma edição de revista a um provedor, feita pela FIKTA.
///
/// É o mesmo desenho de <see cref="ProviderBook"/>: o acervo é global, o acesso é
/// concedido por parceiro. Sem uma linha aqui, os assinantes daquele provedor não
/// enxergam a edição — o que também é o mecanismo de licenciamento, já que nem toda
/// editora libera todo o catálogo para todo provedor.
/// </summary>
public class ProviderMagazine : BaseEntity, IProviderEntity
{
    public Guid ProviderId { get; set; }
    public virtual Provider Provider { get; set; } = null!;

    public Guid MagazineId { get; set; }
    public virtual Magazine Magazine { get; set; } = null!;

    public string Status { get; set; } = "ACTIVE"; // ACTIVE, INACTIVE

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Operador da FIKTA que liberou a edição para este provedor.</summary>
    public string? AssignedBy { get; set; }

    /// <summary>
    /// Downloads/leituras contabilizados nesta concessão. Materializado porque a métrica
    /// aparece em toda listagem de revistas do painel; contar linhas de log a cada
    /// renderização não escala com o histórico.
    /// </summary>
    public int AccessCount { get; set; }
}
