using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Fikta.Application.Common.Interfaces;
using Fikta.Application.Common.Models;
using Fikta.Application.Services;
using Fikta.Domain.Entities;
using Fikta.Infrastructure.Persistence;
using Xunit;

namespace Fikta.Tests;

public class EligibilityEngineTests
{
    private readonly Mock<ITenantContext> _tenantContextMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly Mock<IEncryptionService> _encryptionServiceMock;
    private readonly Mock<IExternalCustomerProvider> _customerProviderMock;
    private readonly Mock<IExternalFinancialProvider> _financialProviderMock;
    private readonly Mock<ILogger<EligibilityService>> _loggerMock;
    private readonly string _databaseName = Guid.NewGuid().ToString();

    public EligibilityEngineTests()
    {
        _tenantContextMock = new Mock<ITenantContext>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _encryptionServiceMock = new Mock<IEncryptionService>();
        _customerProviderMock = new Mock<IExternalCustomerProvider>();
        _financialProviderMock = new Mock<IExternalFinancialProvider>();
        _loggerMock = new Mock<ILogger<EligibilityService>>();
    }

    private ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: _databaseName)
            .Options;

        return new ApplicationDbContext(options, _tenantContextMock.Object, _currentUserServiceMock.Object);
    }

    [Fact]
    public async Task EvaluateCustomerAccessAsync_ShouldReturnBlocked_WhenCustomerDoesNotExist()
    {
        // Arrange
        using var context = CreateDbContext();
        var service = new EligibilityService(
            context,
            _encryptionServiceMock.Object,
            _customerProviderMock.Object,
            _financialProviderMock.Object,
            _loggerMock.Object);

        // Act
        var result = await service.EvaluateCustomerAccessAsync(Guid.NewGuid());

        // Assert
        Assert.False(result.IsEligible);
        Assert.Equal("CUSTOMER_NOT_FOUND", result.BlockReason);
    }

    [Fact]
    public async Task EvaluateCustomerAccessAsync_ShouldReturnEligible_WhenActiveAndNoDelinquency()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var providerId = Guid.NewGuid();
        var integrationId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();

        _tenantContextMock.Setup(c => c.IsPlatformContext).Returns(true);

        using (var context = CreateDbContext())
        {
            var provider = new Provider
            {
                Id = providerId,
                Name = "Test Provider",
                Cnpj = "12.345.678/0001-99",
                Domain = "test.com",
                Status = "ACTIVE",
                Settings = JsonSerializer.Serialize(new
                {
                    BlockIfDelinquent = true,
                    GracePeriodDays = 5,
                    MaxOverdueTitles = 1
                })
            };
            context.Providers.Add(provider);

            var customer = new Customer
            {
                Id = customerId,
                ProviderId = providerId,
                Name = "John Doe",
                Email = "john@doe.com",
                Document = "123.456.789-00",
                Status = "ACTIVE"
            };
            context.Customers.Add(customer);

            var integration = new Integration
            {
                Id = integrationId,
                ProviderId = providerId,
                ExternalSystemId = Guid.NewGuid(),
                EndpointUrl = "https://erp.com",
                Status = "ACTIVE"
            };
            context.Integrations.Add(integration);

            var credential = new IntegrationCredential
            {
                IntegrationId = integrationId,
                EncryptedClientId = "encrypted_id",
                EncryptedClientSecret = "encrypted_secret",
                EncryptedSyndata = "encrypted_syndata"
            };
            context.IntegrationCredentials.Add(credential);

            var mapping = new ExternalProductMapping
            {
                IntegrationId = integrationId,
                ExternalProductId = "987",
                InternalProductCode = "BOOKS_PREMIUM"
            };
            context.ExternalProductMappings.Add(mapping);

            var rule = new CatalogAccessRule
            {
                ProviderId = providerId,
                InternalProductCode = "BOOKS_PREMIUM",
                CategoryId = categoryId,
                CollectionId = null
            };
            context.CatalogAccessRules.Add(rule);

            await context.SaveChangesAsync();
        }

        // Mock decrypt behavior
        _encryptionServiceMock.Setup(e => e.Decrypt(It.IsAny<string>()))
            .Returns((string s) => s.Replace("encrypted_", ""));

        // Mock External ERP Providers
        _customerProviderMock.Setup(p => p.GetCustomerByDocumentAsync(It.IsAny<string>(), It.IsAny<IntegrationSettings>()))
            .ReturnsAsync(new NormalizedCustomerDto
            {
                ExternalId = "111",
                Name = "John Doe",
                Document = "123.456.789-00",
                Status = "ACTIVE",
                Contracts = new List<NormalizedContractDto>
                {
                    new NormalizedContractDto
                    {
                        ContractId = "c1",
                        Status = "ACTIVE",
                        ServiceProductCodes = new List<string> { "987" }
                    }
                }
            });

        _financialProviderMock.Setup(f => f.GetCustomerFinancialStatusAsync(It.IsAny<string>(), It.IsAny<IntegrationSettings>()))
            .ReturnsAsync(new NormalizedFinancialDto
            {
                IsDelinquent = false,
                OverdueDays = 0,
                PendingInvoices = new List<NormalizedInvoiceDto>()
            });

        // Act
        using (var context = CreateDbContext())
        {
            var service = new EligibilityService(
                context,
                _encryptionServiceMock.Object,
                _customerProviderMock.Object,
                _financialProviderMock.Object,
                _loggerMock.Object);

            var result = await service.EvaluateCustomerAccessAsync(customerId);

            // Assert
            Assert.True(result.IsEligible);
            Assert.Contains(categoryId, result.AllowedCategoryIds);
        }
    }
}
