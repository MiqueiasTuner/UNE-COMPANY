using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class Customer : BaseEntity, IProviderEntity
{
    public Guid ProviderId { get; set; }
    public virtual Provider Provider { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty; // Unique within provider context
    public string Phone { get; set; } = string.Empty;
    public string Document { get; set; } = string.Empty; // CPF/CNPJ
    public string PasswordHash { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, SUSPENDED
}
