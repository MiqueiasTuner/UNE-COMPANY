using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using Fikta.Domain.Entities;

namespace Fikta.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<Provider> Providers { get; }
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<Customer> Customers { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<ExternalSystem> ExternalSystems { get; }
    DbSet<Integration> Integrations { get; }
    DbSet<IntegrationCredential> IntegrationCredentials { get; }
    DbSet<ExternalProductMapping> ExternalProductMappings { get; }
    DbSet<CatalogAccessRule> CatalogAccessRules { get; }
    DbSet<Author> Authors { get; }
    DbSet<Publisher> Publishers { get; }
    DbSet<Category> Categories { get; }
    DbSet<Collection> Collections { get; }
    DbSet<Supplier> Suppliers { get; }
    DbSet<License> Licenses { get; }
    DbSet<Book> Books { get; }
    DbSet<ProviderBook> ProviderBooks { get; }
    DbSet<CustomerBook> CustomerBooks { get; }
    DbSet<EmailTemplate> EmailTemplates { get; }
    DbSet<EmailDelivery> EmailDeliveries { get; }
    DbSet<EmailDeliveryLog> EmailDeliveryLogs { get; }
    DbSet<CustomerInvoice> CustomerInvoices { get; }
    DbSet<ErpSyncLog> ErpSyncLogs { get; }
    DbSet<PlatformModule> Modules { get; }
    DbSet<ProviderModule> ProviderModules { get; }
    DbSet<Magazine> Magazines { get; }
    DbSet<ProviderMagazine> ProviderMagazines { get; }
    DbSet<AccessLog> AccessLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    int SaveChanges();
}
