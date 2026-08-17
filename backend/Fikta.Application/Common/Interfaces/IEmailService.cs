using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Fikta.Application.Common.Interfaces;

public interface IEmailService
{
    Task QueueEmailAsync(Guid providerId, Guid? customerId, string toAddress, string templateName, Dictionary<string, string> placeholders);
    Task ProcessPendingEmailsAsync();
}
