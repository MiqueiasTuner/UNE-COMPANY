using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Fikta.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedPlatformModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Modules",
                columns: new[] { "Id", "Code", "CreatedAt", "CreatedBy", "Description", "Icon", "Name", "RequiresErp", "SortOrder", "Status", "Surface", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("a1000000-0000-4000-8000-000000000001"), "READING", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Acervo de livros digitais liberado pela FIKTA ao provedor.", "tabler:book", "Leitura Digital", false, 1, "ACTIVE", "BOTH", null, null },
                    { new Guid("a1000000-0000-4000-8000-000000000002"), "MAGAZINES", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Edições periódicas publicadas pela FIKTA e disponibilizadas por provedor.", "tabler:news", "Revistas Digitais", false, 2, "ACTIVE", "BOTH", null, null },
                    { new Guid("a1000000-0000-4000-8000-000000000003"), "CONNECTION_STATUS", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Situação do link do assinante, lida do ERP do provedor.", "tabler:wifi", "Status de Conexão", true, 3, "ACTIVE", "B2C", null, null },
                    { new Guid("a1000000-0000-4000-8000-000000000004"), "TICKETS", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Histórico e abertura de chamados no Service Desk do provedor.", "tabler:headset", "Suporte & Chamados", true, 4, "ACTIVE", "B2C", null, null },
                    { new Guid("a1000000-0000-4000-8000-000000000005"), "BILLING", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Faturas em aberto, linha digitável e segunda via, vindas do ERP.", "tabler:file-invoice", "Faturas & Boletos", true, 5, "ACTIVE", "B2C", null, null },
                    { new Guid("a1000000-0000-4000-8000-000000000006"), "CLUB", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Ofertas e cupons de parceiros comerciais.", "tabler:sparkles", "Clube de Vantagens", false, 6, "ACTIVE", "B2C", null, null },
                    { new Guid("a1000000-0000-4000-8000-000000000007"), "PORTAL_CUSTOMIZATION", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "White label do Super Portal: cores, logo e conteúdo do provedor.", "tabler:palette", "Personalização do Portal", false, 7, "ACTIVE", "PROVIDER_ADMIN", null, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Modules",
                keyColumn: "Id",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "Modules",
                keyColumn: "Id",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "Modules",
                keyColumn: "Id",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000003"));

            migrationBuilder.DeleteData(
                table: "Modules",
                keyColumn: "Id",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000004"));

            migrationBuilder.DeleteData(
                table: "Modules",
                keyColumn: "Id",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000005"));

            migrationBuilder.DeleteData(
                table: "Modules",
                keyColumn: "Id",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000006"));

            migrationBuilder.DeleteData(
                table: "Modules",
                keyColumn: "Id",
                keyValue: new Guid("a1000000-0000-4000-8000-000000000007"));
        }
    }
}
