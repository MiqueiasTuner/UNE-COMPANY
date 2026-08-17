using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

public class IntegrationCredential : BaseEntity
{
    public Guid IntegrationId { get; set; }
    public virtual Integration Integration { get; set; } = null!;

    public string EncryptedClientId { get; set; } = string.Empty;
    public string EncryptedClientSecret { get; set; } = string.Empty;
    public string? EncryptedSyndata { get; set; } // Specific to Voalle
    public string? EncryptedAdditionalSecrets { get; set; } // JSON or dictionary serialized
}
