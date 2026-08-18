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

    /// <summary>
    /// Timestamp fixo para as linhas de HasData. BaseEntity usa DateTime.UtcNow como valor
    /// padrão, que o EF avaliaria a cada scaffold — gerando uma migration nova toda vez que
    /// alguém rodasse o comando, mesmo sem mudança de modelo.
    /// </summary>
    private static readonly DateTime SeedTimestamp = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

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
    public DbSet<CustomerInvoice> CustomerInvoices => Set<CustomerInvoice>();
    public DbSet<ErpSyncLog> ErpSyncLogs => Set<ErpSyncLog>();
    public DbSet<PlatformModule> Modules => Set<PlatformModule>();
    public DbSet<ProviderModule> ProviderModules => Set<ProviderModule>();
    public DbSet<Magazine> Magazines => Set<Magazine>();
    public DbSet<ProviderMagazine> ProviderMagazines => Set<ProviderMagazine>();
    public DbSet<AccessLog> AccessLogs => Set<AccessLog>();

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
        // Filtrado: CNPJ continua único quando informado, mas vários provedores podem
        // conviver sem documento enquanto o cadastro não é completado.
        modelBuilder.Entity<Provider>()
            .HasIndex(p => p.Cnpj)
            .IsUnique()
            .HasFilter("\"Cnpj\" IS NOT NULL");

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

        // A person exists once per provider in the ERP, so re-importing the same subscriber
        // must update the existing row instead of creating a twin. Filtered because
        // manually-created customers legitimately have no ExternalId.
        modelBuilder.Entity<Customer>()
            .HasIndex(c => new { c.ProviderId, c.ExternalId })
            .IsUnique()
            .HasFilter("\"ExternalId\" IS NOT NULL");

        // Same idea for invoices: the ERP title id is the natural key for an upsert,
        // otherwise every sync round would append duplicates of the same open invoice.
        modelBuilder.Entity<CustomerInvoice>()
            .HasIndex(i => new { i.ProviderId, i.ExternalId })
            .IsUnique();

        // Drives the B2C "my invoices" list and the delinquency recalculation.
        modelBuilder.Entity<CustomerInvoice>()
            .HasIndex(i => new { i.CustomerId, i.Status, i.DueDate });

        modelBuilder.Entity<CustomerInvoice>()
            .Property(i => i.Amount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<CustomerInvoice>()
            .Property(i => i.OriginalAmount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Customer>()
            .Property(c => c.OverdueAmount)
            .HasPrecision(18, 2);

        // Support traces a subscriber's sync history; ops watches failures per provider.
        modelBuilder.Entity<ErpSyncLog>()
            .HasIndex(l => new { l.ProviderId, l.Operation, l.CreatedAt });

        // Consumo por provedor num período — é a consulta do faturamento mensal,
        // e sem índice ela varre a tabela que mais cresce no sistema.
        modelBuilder.Entity<AccessLog>()
            .HasIndex(l => new { l.ProviderId, l.OccurredAt });

        // Histórico de um assinante específico, usado pelo suporte.
        modelBuilder.Entity<AccessLog>()
            .HasIndex(l => new { l.CustomerId, l.OccurredAt });

        // Ranking de títulos mais consumidos por provedor.
        modelBuilder.Entity<AccessLog>()
            .HasIndex(l => new { l.ProviderId, l.ContentType, l.ContentId });

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

        // Module code is the contract between backend and frontend — it must be unique
        // and stable, since the UI keys entire sections off it.
        modelBuilder.Entity<PlatformModule>()
            .HasIndex(m => m.Code)
            .IsUnique();

        // Catálogo de módulos da plataforma.
        //
        // Isto é dado de REFERÊNCIA, não dado de negócio: descreve o que a plataforma sabe
        // fazer, e é o mesmo em qualquer instalação. Nenhum provedor recebe módulo por
        // padrão — a concessão é sempre um ato explícito da FIKTA em ProviderModules.
        //
        // Os Guids são fixos de propósito: HasData exige chave estável, senão cada migration
        // apagaria e recriaria as linhas, derrubando as concessões que as referenciam.
        modelBuilder.Entity<PlatformModule>().HasData(
            new PlatformModule
            {
                Id = Guid.Parse("a1000000-0000-4000-8000-000000000001"),
                Code = "READING",
                Name = "Leitura Digital",
                Description = "Acervo de livros digitais liberado pela FIKTA ao provedor.",
                Icon = "tabler:book",
                Surface = "BOTH",
                RequiresErp = false,
                SortOrder = 1,
                CreatedAt = SeedTimestamp
            },
            new PlatformModule
            {
                Id = Guid.Parse("a1000000-0000-4000-8000-000000000002"),
                Code = "MAGAZINES",
                Name = "Revistas Digitais",
                Description = "Edições periódicas publicadas pela FIKTA e disponibilizadas por provedor.",
                Icon = "tabler:news",
                Surface = "BOTH",
                RequiresErp = false,
                SortOrder = 2,
                CreatedAt = SeedTimestamp
            },
            new PlatformModule
            {
                Id = Guid.Parse("a1000000-0000-4000-8000-000000000003"),
                Code = "CONNECTION_STATUS",
                Name = "Status de Conexão",
                Description = "Situação do link do assinante, lida do ERP do provedor.",
                Icon = "tabler:wifi",
                Surface = "B2C",
                RequiresErp = true,
                SortOrder = 3,
                CreatedAt = SeedTimestamp
            },
            new PlatformModule
            {
                Id = Guid.Parse("a1000000-0000-4000-8000-000000000004"),
                Code = "TICKETS",
                Name = "Suporte & Chamados",
                Description = "Histórico e abertura de chamados no Service Desk do provedor.",
                Icon = "tabler:headset",
                Surface = "B2C",
                RequiresErp = true,
                SortOrder = 4,
                CreatedAt = SeedTimestamp
            },
            new PlatformModule
            {
                Id = Guid.Parse("a1000000-0000-4000-8000-000000000005"),
                Code = "BILLING",
                Name = "Faturas & Boletos",
                Description = "Faturas em aberto, linha digitável e segunda via, vindas do ERP.",
                Icon = "tabler:file-invoice",
                Surface = "B2C",
                RequiresErp = true,
                SortOrder = 5,
                CreatedAt = SeedTimestamp
            },
            new PlatformModule
            {
                Id = Guid.Parse("a1000000-0000-4000-8000-000000000006"),
                Code = "CLUB",
                Name = "Clube de Vantagens",
                Description = "Ofertas e cupons de parceiros comerciais.",
                Icon = "tabler:sparkles",
                Surface = "B2C",
                RequiresErp = false,
                SortOrder = 6,
                CreatedAt = SeedTimestamp
            },
            new PlatformModule
            {
                Id = Guid.Parse("a1000000-0000-4000-8000-000000000007"),
                Code = "PORTAL_CUSTOMIZATION",
                Name = "Personalização do Portal",
                Description = "White label do Super Portal: cores, logo e conteúdo do provedor.",
                Icon = "tabler:palette",
                Surface = "PROVIDER_ADMIN",
                RequiresErp = false,
                SortOrder = 7,
                CreatedAt = SeedTimestamp
            }
        );

        // A module is granted to a provider at most once; toggling uses Enabled.
        modelBuilder.Entity<ProviderModule>()
            .HasIndex(pm => new { pm.ProviderId, pm.ModuleId })
            .IsUnique();

        // One issue per competence per publisher-less catalog: the pair (Year, Month)
        // plus title is what the subscriber recognises, and drives the "latest issue" query.
        modelBuilder.Entity<Magazine>()
            .HasIndex(m => new { m.Year, m.Month, m.Status });

        modelBuilder.Entity<ProviderMagazine>()
            .HasIndex(pm => new { pm.ProviderId, pm.MagazineId })
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
