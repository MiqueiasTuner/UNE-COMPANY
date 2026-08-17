using System;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Fikta.Application.Common.Interfaces;
using Fikta.Domain.Common;
using Fikta.Domain.Entities;

namespace Fikta.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService) : base(options)
    {
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Provider> Providers => Set<Provider>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<ExternalSystem> ExternalSystems => Set<ExternalSystem>();
    public DbSet<Integration> Integrations => Set<Integration>();
    public DbSet<IntegrationCredential> IntegrationCredentials => Set<IntegrationCredential>();
    public DbSet<ExternalProductMapping> ExternalProductMappings => Set<ExternalProductMapping>();
    public DbSet<CatalogAccessRule> CatalogAccessRules => Set<CatalogAccessRule>();
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<Publisher> Publishers => Set<Publisher>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Collection> Collections => Set<Collection>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<License> Licenses => Set<License>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<ProviderBook> ProviderBooks => Set<ProviderBook>();
    public DbSet<CustomerBook> CustomerBooks => Set<CustomerBook>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();
    public DbSet<EmailDelivery> EmailDeliveries => Set<EmailDelivery>();
    public DbSet<EmailDeliveryLog> EmailDeliveryLogs => Set<EmailDeliveryLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure RolePermission composite key
        modelBuilder.Entity<RolePermission>()
            .HasKey(rp => new { rp.RoleId, rp.PermissionId });

        modelBuilder.Entity<RolePermission>()
            .HasOne(rp => rp.Role)
            .WithMany(r => r.RolePermissions)
            .HasForeignKey(rp => rp.RoleId);

        modelBuilder.Entity<RolePermission>()
            .HasOne(rp => rp.Permission)
            .WithMany(p => p.RolePermissions)
            .HasForeignKey(rp => rp.PermissionId);

        // Unique constraints
        modelBuilder.Entity<Provider>()
            .HasIndex(p => p.Cnpj)
            .IsUnique();

        modelBuilder.Entity<Provider>()
            .HasIndex(p => p.Domain)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Customer Email uniqueness is scoped to their Provider context
        modelBuilder.Entity<Customer>()
            .HasIndex(c => new { c.ProviderId, c.Email })
            .IsUnique();

        modelBuilder.Entity<Customer>()
            .HasIndex(c => new { c.ProviderId, c.Document })
            .IsUnique();

        // ExternalSystem Unique Name
        modelBuilder.Entity<ExternalSystem>()
            .HasIndex(es => es.Name)
            .IsUnique();

        // One-to-One Integration -> IntegrationCredential
        modelBuilder.Entity<Integration>()
            .HasOne(i => i.Credential)
            .WithOne(ic => ic.Integration)
            .HasForeignKey<IntegrationCredential>(ic => ic.IntegrationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Composite Index for Product Mappings
        modelBuilder.Entity<ExternalProductMapping>()
            .HasIndex(epm => new { epm.IntegrationId, epm.ExternalProductId })
            .IsUnique();

        // Book ISBN uniqueness
        modelBuilder.Entity<Book>()
            .HasIndex(b => b.Isbn)
            .IsUnique();

        // ProviderBook composite unique key
        modelBuilder.Entity<ProviderBook>()
            .HasIndex(pb => new { pb.ProviderId, pb.BookId })
            .IsUnique();

        // Category slug uniqueness
        modelBuilder.Entity<Category>()
            .HasIndex(c => c.Slug)
            .IsUnique();

        // Category self reference parent relationship
        modelBuilder.Entity<Category>()
            .HasOne(c => c.Parent)
            .WithMany(c => c.SubCategories)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        // CustomerBook composite unique index
        modelBuilder.Entity<CustomerBook>()
            .HasIndex(cb => new { cb.CustomerId, cb.BookId })
            .IsUnique();

        // Apply Global Query Filters dynamically for ITenantEntity and IProviderEntity
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(ApplicationDbContext)
                    .GetMethod(nameof(ConfigureTenantFilter), BindingFlags.NonPublic | BindingFlags.Instance)?
                    .MakeGenericMethod(entityType.ClrType);
                method?.Invoke(this, new object[] { modelBuilder });
            }
            else if (typeof(IProviderEntity).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(ApplicationDbContext)
                    .GetMethod(nameof(ConfigureProviderFilter), BindingFlags.NonPublic | BindingFlags.Instance)?
                    .MakeGenericMethod(entityType.ClrType);
                method?.Invoke(this, new object[] { modelBuilder });
            }
        }
    }

    private void ConfigureTenantFilter<TEntity>(ModelBuilder modelBuilder) where TEntity : class, ITenantEntity
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(e => _tenantContext.IsPlatformContext || e.TenantId == _tenantContext.TenantId);
    }

    private void ConfigureProviderFilter<TEntity>(ModelBuilder modelBuilder) where TEntity : class, IProviderEntity
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(e => _tenantContext.IsPlatformContext || e.ProviderId == _tenantContext.ProviderId);
    }

    public override int SaveChanges()
    {
        ApplyAuditAndTenantInfo();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditAndTenantInfo();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyAuditAndTenantInfo()
    {
        var entries = ChangeTracker.Entries<BaseEntity>();
        var userId = _currentUserService.UserId;

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.CreatedBy = userId;

                // Automatically set TenantId if entity implements ITenantEntity and it's not already set
                if (entry.Entity is ITenantEntity tenantEntity && tenantEntity.TenantId == Guid.Empty)
                {
                    if (_tenantContext.TenantId.HasValue)
                    {
                        tenantEntity.TenantId = _tenantContext.TenantId.Value;
                    }
                }

                // Automatically set ProviderId if entity implements IProviderEntity and it's not already set
                if (entry.Entity is IProviderEntity providerEntity && providerEntity.ProviderId == Guid.Empty)
                {
                    if (_tenantContext.ProviderId.HasValue)
                    {
                        providerEntity.ProviderId = _tenantContext.ProviderId.Value;
                    }
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
                entry.Entity.UpdatedBy = userId;
            }
        }
    }
}
