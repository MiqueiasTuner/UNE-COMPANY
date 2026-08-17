using System;
using System.Collections.Generic;

namespace Fikta.Application.Common.Models;

public class EligibilityResultDto
{
    public bool IsEligible { get; set; }
    public string BlockReason { get; set; } = string.Empty; // PROVIDER_SUSPENDED, CUSTOMER_SUSPENDED, DELINQUENT, NO_ACTIVE_CONTRACT, NO_MAPPED_PRODUCTS, OK
    public List<string> MappedProductCodes { get; set; } = new();
    public List<Guid> AllowedCategoryIds { get; set; } = new();
    public List<Guid> AllowedCollectionIds { get; set; } = new();
}
