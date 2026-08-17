using System.Collections.Generic;

namespace Fikta.Application.Common.Models;

public class NormalizedCustomerDto
{
    public string ExternalId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Document { get; set; } = string.Empty; // CPF/CNPJ
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, INACTIVE, SUSPENDED
    public List<NormalizedContractDto> Contracts { get; set; } = new();
}

public class NormalizedContractDto
{
    public string ContractId { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, CANCELLED, SUSPENDED
    public List<string> ServiceProductCodes { get; set; } = new();
}
