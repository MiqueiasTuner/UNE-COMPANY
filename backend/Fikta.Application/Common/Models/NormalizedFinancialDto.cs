using System;
using System.Collections.Generic;

namespace Fikta.Application.Common.Models;

public class NormalizedFinancialDto
{
    public bool IsDelinquent { get; set; }
    public decimal OverdueAmount { get; set; }
    public int OverdueDays { get; set; }
    public List<NormalizedInvoiceDto> PendingInvoices { get; set; } = new();
}

public class NormalizedInvoiceDto
{
    public string InvoiceId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = "PENDING"; // PENDING, OVERDUE, PAID
}
