using System;
using System.Collections.Generic;
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

    // ---------------------------------------------------------------------
    // ERP mirroring
    //
    // The provider's ERP is the source of truth; these columns record what we
    // projected from it and when, so a stale row is always recognisable as stale.
    // See docs/architecture/VOALLE-API-REFERENCE.md §7.
    // ---------------------------------------------------------------------

    /// <summary>Person id in the provider's ERP (Voalle `people.id`). Null when created manually.</summary>
    public string? ExternalId { get; set; }

    /// <summary>Where this record came from: ERP_VOALLE, ERP_IXC, MANUAL, SEED.</summary>
    public string SyncSource { get; set; } = "MANUAL";

    /// <summary>Last time the registration data was refreshed from the ERP.</summary>
    public DateTime? SyncedAt { get; set; }

    /// <summary>Birth date when the document is a CPF. Null for CNPJ — Voalle omits it.</summary>
    public DateTime? BirthDate { get; set; }

    // ---------------------------------------------------------------------
    // Materialised eligibility
    //
    // The delinquency verdict is computed when invoices are synced, never on the
    // read path. This keeps the reading guard at zero API cost per page view.
    // ---------------------------------------------------------------------

    public bool IsDelinquent { get; set; }

    /// <summary>Largest overdue span across open invoices, in days.</summary>
    public int OverdueDays { get; set; }

    /// <summary>Sum of `billet.amount.finalValue` across overdue invoices.</summary>
    public decimal OverdueAmount { get; set; }

    /// <summary>When the verdict above was last recalculated.</summary>
    public DateTime? EligibilityCheckedAt { get; set; }

    public virtual ICollection<CustomerInvoice> Invoices { get; set; } = new List<CustomerInvoice>();
}
