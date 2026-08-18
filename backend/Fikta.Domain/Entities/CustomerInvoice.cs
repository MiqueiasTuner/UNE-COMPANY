using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

/// <summary>
/// A subscriber invoice mirrored from the provider's ERP.
///
/// Exists so the B2C portal and the eligibility guard can answer instantly without
/// hitting the ERP on every page view — Voalle caps integrators at 30 req/min, which
/// a few hundred subscribers would exhaust in seconds. See VOALLE-API-REFERENCE.md §7.3.
///
/// Rows are never hard-deleted: `getopentitlesbytxid` simply stops returning an invoice
/// once it is paid, so a title that disappears from the ERP is marked PAID_OR_REMOVED
/// rather than vanishing from our history.
/// </summary>
public class CustomerInvoice : BaseEntity, IProviderEntity
{
    public Guid ProviderId { get; set; }
    public virtual Provider Provider { get; set; } = null!;

    public Guid CustomerId { get; set; }
    public virtual Customer Customer { get; set; } = null!;

    /// <summary>Title id in the ERP (`id` in the Voalle response). Unique per provider.</summary>
    public string ExternalId { get; set; } = string.Empty;

    /// <summary>Human-facing document number, e.g. "FAT000000000000000".</summary>
    public string TitleNumber { get; set; } = string.Empty;

    /// <summary>
    /// Amount actually owed — maps to `billet.amount.finalValue`, which already carries
    /// fine, interest and discount. Never map this from `amount.value`.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>Face value before fine/interest/discount (`billet.amount.value`).</summary>
    public decimal OriginalAmount { get; set; }

    public DateTime DueDate { get; set; }

    public DateTime? IssueDate { get; set; }

    /// <summary>OPEN, OVERDUE, PAID_OR_REMOVED, CANCELLED.</summary>
    public string Status { get; set; } = "OPEN";

    /// <summary>Boleto "linha digitável" (`billet.typefulLine`).</summary>
    public string? TypefulLine { get; set; }

    /// <summary>
    /// Deliberately NOT persisted long term — the payload is re-fetched with the invoice.
    /// Kept nullable so a sync can drop it without losing the row.
    /// </summary>
    public string? PixQrCode { get; set; }

    /// <summary>Last time this row was confirmed against the ERP.</summary>
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;

    /// <summary>When the ERP stopped returning this title, i.e. it was settled or cancelled.</summary>
    public DateTime? DisappearedFromErpAt { get; set; }
}
