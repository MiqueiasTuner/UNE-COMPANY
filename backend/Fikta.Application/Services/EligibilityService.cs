using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Fikta.Application.Common.Interfaces;
using Fikta.Application.Common.Models;
using Fikta.Domain.Entities;

namespace Fikta.Application.Services;

public class EligibilityService : IEligibilityService
{
    private readonly IApplicationDbContext _context;
    private readonly IEncryptionService _encryptionService;
    private readonly IExternalCustomerProvider _customerProvider;
    private readonly IExternalFinancialProvider _financialProvider;
    private readonly ILogger<EligibilityService> _logger;

    public EligibilityService(
        IApplicationDbContext context,
        IEncryptionService encryptionService,
        IExternalCustomerProvider customerProvider,
        IExternalFinancialProvider financialProvider,
        ILogger<EligibilityService> logger)
    {
        _context = context;
        _encryptionService = encryptionService;
        _customerProvider = customerProvider;
        _financialProvider = financialProvider;
        _logger = logger;
    }

    public async Task<EligibilityResultDto> EvaluateCustomerAccessAsync(Guid customerId)
    {
        _logger.LogInformation("Evaluating eligibility for customer {CustomerId}", customerId);

        // 1. Retrieve Customer (with Provider)
        var customer = await _context.Customers
            .Include(c => c.Provider)
            .FirstOrDefaultAsync(c => c.Id == customerId);

        if (customer == null)
        {
            _logger.LogWarning("Customer {CustomerId} not found in database", customerId);
            return new EligibilityResultDto { IsEligible = false, BlockReason = "CUSTOMER_NOT_FOUND" };
        }

        // 2. Check Customer local status
        if (customer.Status != "ACTIVE")
        {
            _logger.LogWarning("Customer {CustomerId} is marked as SUSPENDED/INACTIVE in local DB", customerId);
            return new EligibilityResultDto { IsEligible = false, BlockReason = "CUSTOMER_SUSPENDED" };
        }

        // 3. Check Parent Provider status
        if (customer.Provider.Status != "ACTIVE")
        {
            _logger.LogWarning("Provider {ProviderId} of customer {CustomerId} is suspended", customer.ProviderId, customerId);
            return new EligibilityResultDto { IsEligible = false, BlockReason = "PROVIDER_SUSPENDED" };
        }

        // 4. Retrieve Active Integration for the Provider
        var integration = await _context.Integrations
            .Include(i => i.Credential)
            .FirstOrDefaultAsync(i => i.ProviderId == customer.ProviderId && i.Status == "ACTIVE");

        if (integration == null || integration.Credential == null)
        {
            _logger.LogWarning("No active integration or credentials configured for provider {ProviderId}", customer.ProviderId);
            return new EligibilityResultDto { IsEligible = false, BlockReason = "NO_ACTIVE_INTEGRATION" };
        }

        // 5. Decrypt Integration settings
        var settings = new IntegrationSettings
        {
            EndpointUrl = integration.EndpointUrl,
            ClientId = _encryptionService.Decrypt(integration.Credential.EncryptedClientId),
            ClientSecret = _encryptionService.Decrypt(integration.Credential.EncryptedClientSecret),
            Syndata = _encryptionService.Decrypt(integration.Credential.EncryptedSyndata ?? string.Empty)
        };

        // 6. Call ERP to retrieve customer profile and active contracts
        if (string.IsNullOrWhiteSpace(customer.Document))
        {
            _logger.LogWarning("Customer {CustomerId} does not have a registered CPF/CNPJ document", customerId);
            return new EligibilityResultDto { IsEligible = false, BlockReason = "MISSING_DOCUMENT" };
        }

        var externalCustomer = await _customerProvider.GetCustomerByDocumentAsync(customer.Document, settings);
        if (externalCustomer == null)
        {
            _logger.LogWarning("Customer document {Document} not found in provider ERP", customer.Document);
            return new EligibilityResultDto { IsEligible = false, BlockReason = "CUSTOMER_NOT_FOUND_IN_ERP" };
        }

        if (externalCustomer.Status != "ACTIVE")
        {
            _logger.LogWarning("Customer profile is inactive in external ERP");
            return new EligibilityResultDto { IsEligible = false, BlockReason = "CUSTOMER_SUSPENDED_IN_ERP" };
        }

        var activeContracts = externalCustomer.Contracts
            .Where(c => c.Status == "ACTIVE")
            .ToList();

        if (activeContracts.Count == 0)
        {
            _logger.LogWarning("Customer {CustomerId} does not have any active contract in ERP", customerId);
            return new EligibilityResultDto { IsEligible = false, BlockReason = "NO_ACTIVE_CONTRACT" };
        }

        // 7. Map ERP product IDs to internal codes
        var externalProductIds = activeContracts
            .SelectMany(c => c.ServiceProductCodes)
            .Distinct()
            .ToList();

        var mappings = await _context.ExternalProductMappings
            .Where(m => m.IntegrationId == integration.Id && externalProductIds.Contains(m.ExternalProductId))
            .ToListAsync();

        if (mappings.Count == 0)
        {
            _logger.LogWarning("None of the customer's active ERP products ({ProductIds}) are mapped to internal product codes", string.Join(", ", externalProductIds));
            return new EligibilityResultDto { IsEligible = false, BlockReason = "NO_MAPPED_PRODUCTS" };
        }

        var mappedProductCodes = mappings.Select(m => m.InternalProductCode).Distinct().ToList();

        // 8. Financial Delinquency assessment
        var providerSettings = ParseProviderSettings(customer.Provider.Settings);
        if (providerSettings.BlockIfDelinquent)
        {
            var financial = await _financialProvider.GetCustomerFinancialStatusAsync(externalCustomer.ExternalId, settings);
            if (financial != null && financial.IsDelinquent)
            {
                var overdueTitlesCount = financial.PendingInvoices.Count(pi => pi.Status == "OVERDUE");
                
                if (financial.OverdueDays > providerSettings.GracePeriodDays || overdueTitlesCount > providerSettings.MaxOverdueTitles)
                {
                    _logger.LogWarning("Customer block triggered. Overdue days: {OverdueDays} (Max: {MaxDays}), Overdue titles: {OverdueTitles} (Max: {MaxTitles})",
                        financial.OverdueDays, providerSettings.GracePeriodDays, overdueTitlesCount, providerSettings.MaxOverdueTitles);
                    
                    return new EligibilityResultDto
                    {
                        IsEligible = false,
                        BlockReason = "DELINQUENT",
                        MappedProductCodes = mappedProductCodes
                    };
                }
            }
        }

        // 9. Resolve whitelisted collections and categories based on access rules
        var accessRules = await _context.CatalogAccessRules
            .Where(r => r.ProviderId == customer.ProviderId && mappedProductCodes.Contains(r.InternalProductCode))
            .ToListAsync();

        var allowedCategoryIds = accessRules
            .Where(r => r.CategoryId.HasValue)
            .Select(r => r.CategoryId!.Value)
            .Distinct()
            .ToList();

        var allowedCollectionIds = accessRules
            .Where(r => r.CollectionId.HasValue)
            .Select(r => r.CollectionId!.Value)
            .Distinct()
            .ToList();

        _logger.LogInformation("Customer {CustomerId} eligibility check passed successfully", customerId);

        return new EligibilityResultDto
        {
            IsEligible = true,
            BlockReason = "OK",
            MappedProductCodes = mappedProductCodes,
            AllowedCategoryIds = allowedCategoryIds,
            AllowedCollectionIds = allowedCollectionIds
        };
    }

    private ProviderSettings ParseProviderSettings(string? settingsJson)
    {
        var settings = new ProviderSettings();
        if (string.IsNullOrWhiteSpace(settingsJson))
        {
            return settings;
        }

        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var parsed = JsonSerializer.Deserialize<ProviderSettings>(settingsJson, options);
            if (parsed != null)
            {
                settings = parsed;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse Provider settings JSON");
        }

        return settings;
    }

    private class ProviderSettings
    {
        public bool BlockIfDelinquent { get; set; } = false;
        public int GracePeriodDays { get; set; } = 5;
        public int MaxOverdueTitles { get; set; } = 1;
        public bool AllowAccessAfterDelinquency { get; set; } = false;
    }
}
