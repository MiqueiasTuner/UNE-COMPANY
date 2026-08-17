# Base stage for running the app
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY ["Fikta.Api/Fikta.Api.csproj", "Fikta.Api/"]
COPY ["Fikta.Application/Fikta.Application.csproj", "Fikta.Application/"]
COPY ["Fikta.Domain/Fikta.Domain.csproj", "Fikta.Domain/"]
COPY ["Fikta.Infrastructure/Fikta.Infrastructure.csproj", "Fikta.Infrastructure/"]
RUN dotnet restore "Fikta.Api/Fikta.Api.csproj"

# Copy all source code files
COPY . .
WORKDIR "/src/Fikta.Api"
RUN dotnet build "Fikta.Api.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "Fikta.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Fikta.Api.dll"]
