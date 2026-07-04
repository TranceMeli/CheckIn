using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class MitarbeiterUmbau : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Fachrichtung",
                table: "AspNetUsers");

            migrationBuilder.RenameColumn(
                name: "Kursjahrgang",
                table: "AspNetUsers",
                newName: "Abteilung");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Abteilung",
                table: "AspNetUsers",
                newName: "Kursjahrgang");

            migrationBuilder.AddColumn<int>(
                name: "Fachrichtung",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
