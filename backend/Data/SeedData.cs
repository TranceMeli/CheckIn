using Microsoft.AspNetCore.Identity;
using backend.Models;

namespace backend.Data
{
    public static class SeedData
    {
        public static async Task SeedAdminAsync(UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
        {
            if (!await roleManager.RoleExistsAsync("Admin"))
                await roleManager.CreateAsync(new IdentityRole("Admin"));

            if (!await roleManager.RoleExistsAsync("Mitarbeiter"))
                await roleManager.CreateAsync(new IdentityRole("Mitarbeiter"));

            if (await userManager.FindByEmailAsync("admin@checkin.de") == null)
            {
                var admin = new User
                {
                    UserName = "admin@checkin.de",
                    Email = "admin@checkin.de",
                    FirstName = "Max",
                    LastName = "Mustermann",
                    EmailConfirmed = true,
                };

                await userManager.CreateAsync(admin, "Admin123!");
                await userManager.AddToRoleAsync(admin, "Admin");
            }
        }

        public static async Task SeedUsersAsync(UserManager<User> userManager)
        {
            var users = new List<User>
            {
                new User { UserName = "l.mueller@checkin.de",  Email = "l.mueller@checkin.de",  EmailConfirmed = true, FirstName = "Lukas",  LastName = "Müller",   Abteilung = "Entwicklung" },
                new User { UserName = "s.schmidt@checkin.de",  Email = "s.schmidt@checkin.de",  EmailConfirmed = true, FirstName = "Sarah",  LastName = "Schmidt",  Abteilung = "Entwicklung" },
                new User { UserName = "j.weber@checkin.de",    Email = "j.weber@checkin.de",    EmailConfirmed = true, FirstName = "Jonas",  LastName = "Weber",    Abteilung = "IT-Infrastruktur" },
                new User { UserName = "l.fischer@checkin.de",  Email = "l.fischer@checkin.de",  EmailConfirmed = true, FirstName = "Laura",  LastName = "Fischer",  Abteilung = "IT-Infrastruktur" },
                new User { UserName = "m.wagner@checkin.de",   Email = "m.wagner@checkin.de",   EmailConfirmed = true, FirstName = "Max",    LastName = "Wagner",   Abteilung = "Support" },
                new User { UserName = "a.becker@checkin.de",   Email = "a.becker@checkin.de",   EmailConfirmed = true, FirstName = "Anna",   LastName = "Becker",   Abteilung = "Support" },
                new User { UserName = "t.hoffmann@checkin.de", Email = "t.hoffmann@checkin.de", EmailConfirmed = true, FirstName = "Tim",    LastName = "Hoffmann", Abteilung = "Vertrieb" },
                new User { UserName = "j.koch@checkin.de",     Email = "j.koch@checkin.de",     EmailConfirmed = true, FirstName = "Julia",  LastName = "Koch",     Abteilung = "Vertrieb" },
            };

            foreach (var user in users)
            {
                if (await userManager.FindByEmailAsync(user.Email!) == null)
                {
                    var result = await userManager.CreateAsync(user, "Passwort123!");
                    if (result.Succeeded)
                        await userManager.AddToRoleAsync(user, "Mitarbeiter");
                    else
                        Console.WriteLine($"Fehler bei {user.Email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }
        }

        public static async Task SeedCheckInsAsync(AppDbContext context, UserManager<User> userManager)
        {
            if (context.CheckIns.Any()) return;

            var lukas = await userManager.FindByEmailAsync("l.mueller@checkin.de");
            var sarah = await userManager.FindByEmailAsync("s.schmidt@checkin.de");
            var jonas = await userManager.FindByEmailAsync("j.weber@checkin.de");
            var laura = await userManager.FindByEmailAsync("l.fischer@checkin.de");
            var max = await userManager.FindByEmailAsync("m.wagner@checkin.de");
            var anna = await userManager.FindByEmailAsync("a.becker@checkin.de");
            var tim = await userManager.FindByEmailAsync("t.hoffmann@checkin.de");
            var julia = await userManager.FindByEmailAsync("j.koch@checkin.de");

            var checkIns = new List<CheckIn>
            {
                // Lukas Müller – Entwicklung
                new CheckIn { UserId = lukas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 3) },
                new CheckIn { UserId = lukas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 4) },
                new CheckIn { UserId = lukas!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 5) },
                new CheckIn { UserId = lukas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 6) },
                new CheckIn { UserId = lukas!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 7) },
                new CheckIn { UserId = lukas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 10) },
                new CheckIn { UserId = lukas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 11) },
                new CheckIn { UserId = lukas!.Id, Status = AttendanceStatus.Abwesend,   Timestamp = new DateTime(2026, 3, 12) },
                new CheckIn { UserId = lukas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 13) },
                new CheckIn { UserId = lukas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 14) },

                // Sarah Schmidt – Entwicklung
                new CheckIn { UserId = sarah!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 3) },
                new CheckIn { UserId = sarah!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 4) },
                new CheckIn { UserId = sarah!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 5) },
                new CheckIn { UserId = sarah!.Id, Status = AttendanceStatus.Abwesend,   Timestamp = new DateTime(2026, 3, 6) },
                new CheckIn { UserId = sarah!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 7) },
                new CheckIn { UserId = sarah!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 10) },
                new CheckIn { UserId = sarah!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 11) },
                new CheckIn { UserId = sarah!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 12) },
                new CheckIn { UserId = sarah!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 13) },
                new CheckIn { UserId = sarah!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 14) },

                // Jonas Weber – IT-Infrastruktur
                new CheckIn { UserId = jonas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 3) },
                new CheckIn { UserId = jonas!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 4) },
                new CheckIn { UserId = jonas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 5) },
                new CheckIn { UserId = jonas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 6) },
                new CheckIn { UserId = jonas!.Id, Status = AttendanceStatus.Abwesend,   Timestamp = new DateTime(2026, 3, 7) },
                new CheckIn { UserId = jonas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 10) },
                new CheckIn { UserId = jonas!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 11) },
                new CheckIn { UserId = jonas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 12) },
                new CheckIn { UserId = jonas!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 13) },
                new CheckIn { UserId = jonas!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 14) },

                // Laura Fischer – IT-Infrastruktur
                new CheckIn { UserId = laura!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 3) },
                new CheckIn { UserId = laura!.Id, Status = AttendanceStatus.Abwesend,   Timestamp = new DateTime(2026, 3, 4) },
                new CheckIn { UserId = laura!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 5) },
                new CheckIn { UserId = laura!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 6) },
                new CheckIn { UserId = laura!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 7) },
                new CheckIn { UserId = laura!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 10) },
                new CheckIn { UserId = laura!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 11) },
                new CheckIn { UserId = laura!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 12) },
                new CheckIn { UserId = laura!.Id, Status = AttendanceStatus.Abwesend,   Timestamp = new DateTime(2026, 3, 13) },
                new CheckIn { UserId = laura!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 14) },

                // Max Wagner – Support
                new CheckIn { UserId = max!.Id, Status = AttendanceStatus.Abwesend,   Timestamp = new DateTime(2026, 3, 3) },
                new CheckIn { UserId = max!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 4) },
                new CheckIn { UserId = max!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 5) },
                new CheckIn { UserId = max!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 6) },
                new CheckIn { UserId = max!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 7) },
                new CheckIn { UserId = max!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 10) },
                new CheckIn { UserId = max!.Id, Status = AttendanceStatus.Abwesend,   Timestamp = new DateTime(2026, 3, 11) },
                new CheckIn { UserId = max!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 12) },
                new CheckIn { UserId = max!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 13) },
                new CheckIn { UserId = max!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 14) },

                // Anna Becker – Support
                new CheckIn { UserId = anna!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 3) },
                new CheckIn { UserId = anna!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 4) },
                new CheckIn { UserId = anna!.Id, Status = AttendanceStatus.Abwesend,   Timestamp = new DateTime(2026, 3, 5) },
                new CheckIn { UserId = anna!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 6) },
                new CheckIn { UserId = anna!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 7) },
                new CheckIn { UserId = anna!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 10) },
                new CheckIn { UserId = anna!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 11) },
                new CheckIn { UserId = anna!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 12) },
                new CheckIn { UserId = anna!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 13) },
                new CheckIn { UserId = anna!.Id, Status = AttendanceStatus.Abwesend,   Timestamp = new DateTime(2026, 3, 14) },

                // Tim Hoffmann – Vertrieb
                new CheckIn { UserId = tim!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 3) },
                new CheckIn { UserId = tim!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 4) },
                new CheckIn { UserId = tim!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 5) },
                new CheckIn { UserId = tim!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 6) },
                new CheckIn { UserId = tim!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 7) },
                new CheckIn { UserId = tim!.Id, Status = AttendanceStatus.Abwesend,   Timestamp = new DateTime(2026, 3, 10) },
                new CheckIn { UserId = tim!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 11) },
                new CheckIn { UserId = tim!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 12) },
                new CheckIn { UserId = tim!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 13) },
                new CheckIn { UserId = tim!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 14) },

                // Julia Koch – Vertrieb
                new CheckIn { UserId = julia!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 3) },
                new CheckIn { UserId = julia!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 4) },
                new CheckIn { UserId = julia!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 5) },
                new CheckIn { UserId = julia!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 6) },
                new CheckIn { UserId = julia!.Id, Status = AttendanceStatus.Abwesend,   Timestamp = new DateTime(2026, 3, 7) },
                new CheckIn { UserId = julia!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 10) },
                new CheckIn { UserId = julia!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 11) },
                new CheckIn { UserId = julia!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 12) },
                new CheckIn { UserId = julia!.Id, Status = AttendanceStatus.HomeOffice, Timestamp = new DateTime(2026, 3, 13) },
                new CheckIn { UserId = julia!.Id, Status = AttendanceStatus.Office,     Timestamp = new DateTime(2026, 3, 14) },
            };

            await context.CheckIns.AddRangeAsync(checkIns);
            await context.SaveChangesAsync();
        }
    }
}