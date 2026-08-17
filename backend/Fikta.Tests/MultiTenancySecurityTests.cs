using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using Fikta.Application.Common.Interfaces;
using Fikta.Domain.Entities;
using Fikta.Infrastructure.Persistence;
using Xunit;

namespace Fikta.Tests;

public class MultiTenancySecurityTests
{
    private readonly Mock<ITenantContext> _tenantContextMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly string _databaseName = Guid.NewGuid().ToString();

    public MultiTenancySecurityTests()
    {
        _tenantContextMock = new Mock<ITenantContext>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
    }

    private ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: _databaseName)
            .Options;

        return new ApplicationDbContext(options, _tenantContextMock.Object, _currentUserServiceMock.Object);
    }

    [Fact]
    public async Task QueryFilters_ShouldIsolateProviderData()
    {
        // Arrange
        var provider1Id = Guid.NewGuid();
        var provider2Id = Guid.NewGuid();

        // Seed database
        using (var context = CreateDbContext())
        {
            context.Customers.Add(new Customer { Id = Guid.NewGuid(), ProviderId = provider1Id, Name = "Client Provider 1", Email = "p1@test.com", Status = "ACTIVE" });
            context.Customers.Add(new Customer { Id = Guid.NewGuid(), ProviderId = provider2Id, Name = "Client Provider 2", Email = "p2@test.com", Status = "ACTIVE" });
            await context.SaveChangesAsync();
        }

        // Configure context for Provider 1
        _tenantContextMock.Setup(c => c.IsPlatformContext).Returns(false);
        _tenantContextMock.Setup(c => c.ProviderId).Returns(provider1Id);

        // Act & Assert
        using (var context = CreateDbContext())
        {
            var customers = await context.Customers.ToListAsync();

            Assert.Single(customers);
            Assert.Equal("Client Provider 1", customers[0].Name);
        }
    }

    [Fact]
    public async Task PlatformAdminContext_ShouldBypassTenantFilters()
    {
        // Arrange
        var provider1Id = Guid.NewGuid();
        var provider2Id = Guid.NewGuid();

        // Seed database
        using (var context = CreateDbContext())
        {
            context.Customers.Add(new Customer { Id = Guid.NewGuid(), ProviderId = provider1Id, Name = "Client Provider 1", Email = "p1@test.com", Status = "ACTIVE" });
            context.Customers.Add(new Customer { Id = Guid.NewGuid(), ProviderId = provider2Id, Name = "Client Provider 2", Email = "p2@test.com", Status = "ACTIVE" });
            await context.SaveChangesAsync();
        }

        // Configure context as platform admin
        _tenantContextMock.Setup(c => c.IsPlatformContext).Returns(true);

        // Act & Assert
        using (var context = CreateDbContext())
        {
            var customers = await context.Customers.ToListAsync();

            Assert.Equal(2, customers.Count);
        }
    }
}
