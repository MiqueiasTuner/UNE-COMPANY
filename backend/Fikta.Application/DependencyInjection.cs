using Microsoft.Extensions.DependencyInjection;
using Fikta.Application.Common.Interfaces;
using Fikta.Application.Services;

namespace Fikta.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IEligibilityService, EligibilityService>();
        services.AddScoped<IEmailService, EmailService>();
        return services;
    }
}
