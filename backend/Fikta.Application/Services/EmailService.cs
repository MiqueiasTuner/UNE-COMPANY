using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Fikta.Application.Common.Interfaces;
using Fikta.Domain.Entities;

namespace Fikta.Application.Services;

public class EmailService : IEmailService
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IApplicationDbContext context, ILogger<EmailService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task QueueEmailAsync(Guid providerId, Guid? customerId, string toAddress, string templateName, Dictionary<string, string> placeholders)
    {
        _logger.LogInformation("Queuing email '{TemplateName}' for address '{ToAddress}'", templateName, toAddress);

        // 1. Fetch template
        var template = await _context.EmailTemplates
            .FirstOrDefaultAsync(t => t.Name == templateName && t.Status == "ACTIVE");

        string subjectTemplate = "Notification - UNE Livros";
        string bodyTemplate = "Hello! You have a new notification from UNE Livros.";

        if (template != null)
        {
            subjectTemplate = template.SubjectTemplate;
            bodyTemplate = template.BodyTemplate;
        }

        // 2. Fetch Provider details for White Label branding
        var provider = await _context.Providers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == providerId);

        string providerName = provider?.Name ?? "UNE Telecom";
        string primaryColor = provider?.PrimaryColor ?? "#51A8B1";
        string secondaryColor = provider?.SecondaryColor ?? "#1E293B";

        // Add standard branding placeholders
        if (!placeholders.ContainsKey("ProviderName")) placeholders["ProviderName"] = providerName;
        if (!placeholders.ContainsKey("PrimaryColor")) placeholders["PrimaryColor"] = primaryColor;
        if (!placeholders.ContainsKey("Year")) placeholders["Year"] = DateTime.UtcNow.Year.ToString();

        // 3. Parse subject and body templates with placeholders
        var subject = ParsePlaceholders(subjectTemplate, placeholders);
        var body = ParsePlaceholders(bodyTemplate, placeholders);

        // 4. Wrap with White-Labeled HTML template frame
        var whiteLabelHtml = WrapInWhiteLabelFrame(body, providerName, primaryColor, secondaryColor);

        // 5. Create delivery queue item
        var delivery = new EmailDelivery
        {
            ProviderId = providerId,
            CustomerId = customerId,
            ToAddress = toAddress,
            Subject = subject,
            Body = whiteLabelHtml,
            Status = "PENDING",
            Attempts = 0
        };

        _context.EmailDeliveries.Add(delivery);
        await _context.SaveChangesAsync();
    }

    public async Task ProcessPendingEmailsAsync()
    {
        _logger.LogInformation("Processing pending emails queue...");

        var pendingDeliveries = await _context.EmailDeliveries
            .Where(e => e.Status == "PENDING" && e.Attempts < 3)
            .ToListAsync();

        foreach (var delivery in pendingDeliveries)
        {
            delivery.Attempts++;
            _logger.LogInformation("Attempting delivery ID {DeliveryId} to '{ToAddress}' (Attempt {Attempt})", 
                delivery.Id, delivery.ToAddress, delivery.Attempts);

            var log = new EmailDeliveryLog
            {
                EmailDeliveryId = delivery.Id,
                Timestamp = DateTime.UtcNow
            };

            try
            {
                // In production, integration with SendGrid/SMTP would go here
                // For this implementation, we simulate delivery success
                delivery.Status = "SENT";
                delivery.SentAt = DateTime.UtcNow;
                log.LogMessage = "Email transmitted successfully through SMTP simulator client.";
                _logger.LogInformation("Email ID {DeliveryId} successfully sent.", delivery.Id);
            }
            catch (Exception ex)
            {
                delivery.Status = delivery.Attempts >= 3 ? "FAILED" : "PENDING";
                log.LogMessage = $"SMTP error encountered: {ex.Message}";
                _logger.LogError(ex, "Failed to send email ID {DeliveryId}", delivery.Id);
            }

            _context.EmailDeliveryLogs.Add(log);
        }

        await _context.SaveChangesAsync();
    }

    private string ParsePlaceholders(string template, Dictionary<string, string> placeholders)
    {
        var sb = new StringBuilder(template);
        foreach (var item in placeholders)
        {
            sb.Replace($"{{{{{item.Key}}}}}", item.Value);
        }
        return sb.ToString();
    }

    private string WrapInWhiteLabelFrame(string innerBody, string providerName, string primaryColor, string secondaryColor)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #334155; }}
        .wrapper {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
        .header {{ background-color: {primaryColor}; padding: 30px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }}
        .content {{ padding: 40px 30px; line-height: 1.6; font-size: 16px; }}
        .footer {{ background-color: {secondaryColor}; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }}
        .footer a {{ color: #ffffff; text-decoration: none; }}
    </style>
</head>
<body>
    <div class='wrapper'>
        <div class='header'>
            <h1>{providerName} Livros</h1>
        </div>
        <div class='content'>
            {innerBody}
        </div>
        <div class='footer'>
            <p>&copy; {DateTime.UtcNow.Year} {providerName}. Powered by UNE Livros.</p>
        </div>
    </div>
</body>
</html>";
    }
}
