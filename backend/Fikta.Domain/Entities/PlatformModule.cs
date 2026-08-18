using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

/// <summary>
/// Catálogo global de módulos da plataforma, mantido pela FIKTA.
///
/// Um módulo é uma capacidade que a FIKTA habilita ou não para cada provedor —
/// Leitura Digital, Revistas, Clube de Vantagens, Status de Conexão, Chamados.
/// A tabela existe para que ligar um módulo seja uma configuração, e não um deploy:
/// o menu do provedor e as seções do Super Portal são montados a partir do que
/// está concedido em <see cref="ProviderModule"/>.
/// </summary>
public class PlatformModule : BaseEntity
{
    /// <summary>
    /// Chave estável usada no código e nas rotas do frontend, ex.: "READING", "MAGAZINES",
    /// "CLUB", "CONNECTION_STATUS", "TICKETS". Nunca renomear depois de publicada — é ela
    /// que o frontend consulta para decidir o que renderizar.
    /// </summary>
    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>Ícone Tabler exibido no menu, ex.: "tabler:book".</summary>
    public string? Icon { get; set; }

    /// <summary>
    /// Onde o módulo aparece: PROVIDER_ADMIN (painel do provedor), B2C (Super Portal)
    /// ou BOTH. Evita que uma seção do assinante vaze para o menu administrativo.
    /// </summary>
    public string Surface { get; set; } = "B2C";

    /// <summary>
    /// Se o módulo depende de integração com o ERP para funcionar. "Status de Conexão"
    /// depende; "Leitura Digital" não. Serve para avisar o operador antes de conceder
    /// um módulo a um provedor cuja integração ainda não foi homologada.
    /// </summary>
    public bool RequiresErp { get; set; }

    /// <summary>Ordem de exibição no menu e na sidebar do Super Portal.</summary>
    public int SortOrder { get; set; }

    public string Status { get; set; } = "ACTIVE"; // ACTIVE, INACTIVE

    public virtual ICollection<ProviderModule> ProviderModules { get; set; } = new List<ProviderModule>();
}
