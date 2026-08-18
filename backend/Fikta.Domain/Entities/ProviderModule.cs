using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

/// <summary>
/// Concessão de um <see cref="PlatformModule"/> a um provedor — o registro que a FIKTA usa
/// para ligar e desligar capacidades por parceiro, sem tocar em código.
///
/// A ausência de linha significa "não concedido". A presença com <see cref="Enabled"/>
/// falso significa "concedido porém desligado" — distinção que importa porque um módulo
/// desligado temporariamente (ex.: ERP em homologação) não é o mesmo que um módulo
/// que o provedor nunca contratou.
/// </summary>
public class ProviderModule : BaseEntity, IProviderEntity
{
    public Guid ProviderId { get; set; }
    public virtual Provider Provider { get; set; } = null!;

    public Guid ModuleId { get; set; }
    public virtual PlatformModule Module { get; set; } = null!;

    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Configuração específica do módulo para este provedor, em JSON. Mantido genérico
    /// de propósito: cada módulo tem parâmetros próprios (limite de leitura simultânea,
    /// quais categorias de revista, texto do clube) e criar uma coluna por parâmetro
    /// obrigaria a uma migration a cada ajuste de produto.
    /// </summary>
    public string? Settings { get; set; }

    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Quem concedeu — operador da FIKTA. Necessário para auditoria comercial.</summary>
    public string? GrantedBy { get; set; }

    /// <summary>Quando o acesso expira. Nulo = sem prazo.</summary>
    public DateTime? ExpiresAt { get; set; }
}
