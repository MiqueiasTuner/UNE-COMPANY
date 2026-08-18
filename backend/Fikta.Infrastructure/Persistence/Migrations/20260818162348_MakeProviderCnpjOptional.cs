using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fikta.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MakeProviderCnpjOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Providers_Cnpj",
                table: "Providers");

            migrationBuilder.AlterColumn<string>(
                name: "Cnpj",
                table: "Providers",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_Providers_Cnpj",
                table: "Providers",
                column: "Cnpj",
                unique: true,
                filter: "\"Cnpj\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Providers_Cnpj",
                table: "Providers");

            migrationBuilder.AlterColumn<string>(
                name: "Cnpj",
                table: "Providers",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Providers_Cnpj",
                table: "Providers",
                column: "Cnpj",
                unique: true);
        }
    }
}
