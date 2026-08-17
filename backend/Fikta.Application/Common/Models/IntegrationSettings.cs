namespace Fikta.Application.Common.Models;

public class IntegrationSettings
{
    public string EndpointUrl { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string? Syndata { get; set; }
    public int TimeoutSeconds { get; set; } = 5;
}
