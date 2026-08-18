using System;
using System.Collections.Generic;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class Provider : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public virtual Tenant Tenant { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    /// <summary>
    /// CNPJ do provedor. Nulo é permitido: um parceiro conhecido pode ser cadastrado antes
    /// de o documento estar em mãos, e travar o cadastro por isso empurra o operador a
    /// digitar um CNPJ inventado só para passar da validação.
    /// </summary>
    public string? Cnpj { get; set; }
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, SUSPENDED

    public string? LogoUrl { get; set; }
    public string Domain { get; set; } = string.Empty;
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? FaviconUrl { get; set; }
    public string? Settings { get; set; } // JSON configuration

    // Relationships
    public virtual ICollection<Customer> Customers { get; set; } = new List<Customer>();
}
