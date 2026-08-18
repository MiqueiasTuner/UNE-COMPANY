using System;
using Fikta.Domain.Common;

namespace Fikta.Domain.Entities;

/// <summary>
/// One row per call made to a provider's ERP.
///
/// Serves three purposes that all matter under Voalle's 30 req/min integrator cap:
/// telling a real "customer not found" apart from "the ERP was down", proving how much
/// of the rate budget we actually spend, and giving support a trail when a provider
/// asks why a subscriber was blocked.
/// </summary>
public class ErpSyncLog : BaseEntity, IProviderEntity
{
    public Guid ProviderId { get; set; }
    public virtual Provider Provider { get; set; } = null!;

    /// <summary>Logical operation: CUSTOMER_LOOKUP, INVOICE_SYNC, CATALOG_SYNC, TOKEN.</summary>
    public string Operation { get; set; } = string.Empty;

    /// <summary>ERP vendor hit: VOALLE, IXC, SGP, HUBSOFT.</summary>
    public string Vendor { get; set; } = "VOALLE";

    /// <summary>
    /// What was looked up — usually the CPF/CNPJ. Stored so support can trace a specific
    /// subscriber's syncs; not a secret, but it is personal data, so treat it as such.
    /// </summary>
    public string? Subject { get; set; }

    /// <summary>Endpoint path called, without host or credentials.</summary>
    public string? Endpoint { get; set; }

    public bool Success { get; set; }

    /// <summary>HTTP status, or null when the call never completed (timeout, DNS, refused).</summary>
    public int? HttpStatus { get; set; }

    /// <summary>Error text when Success is false. Never store credentials or tokens here.</summary>
    public string? ErrorMessage { get; set; }

    /// <summary>Round-trip duration, used to spot a degrading ERP before it starts failing.</summary>
    public int DurationMs { get; set; }

    /// <summary>How many records the call returned, when applicable.</summary>
    public int? RecordCount { get; set; }
}
