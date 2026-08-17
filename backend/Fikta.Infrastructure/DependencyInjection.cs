using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Fikta.Application.Common.Interfaces;
using Fikta.Infrastructure.Adapters;
using Fikta.Infrastructure.Persistence;
using Fikta.Infrastructure.Security;
using Fikta.Infrastructure.Services;

namespace Fikta.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddHttpClient();

        services.AddScoped<ITenantContext, TenantContext>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<IEncryptionService, EncryptionService>();

        // Register Voalle Adapter implementations
        services.AddScoped<VoalleAdapter>();
        services.AddScoped<IExternalCustomerProvider, VoalleAdapter>(sp => sp.GetRequiredService<VoalleAdapter>());
        services.AddScoped<IExternalProductProvider, VoalleAdapter>(sp => sp.GetRequiredService<VoalleAdapter>());
        services.AddScoped<IExternalFinancialProvider, VoalleAdapter>(sp => sp.GetRequiredService<VoalleAdapter>());

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString,
                builder => builder.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

        return services;
    }
}
