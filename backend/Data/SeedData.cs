using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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
                new User { UserName = "l.mueller@checkin.de",  Email = "l.mueller@checkin.de",  EmailConfirmed = true, FirstName = "Lukas",  LastName = "Müller",   Abteilung = "Softwareentwicklung" },
                new User { UserName = "s.schmidt@checkin.de",  Email = "s.schmidt@checkin.de",  EmailConfirmed = true, FirstName = "Sarah",  LastName = "Schmidt",  Abteilung = "Softwareentwicklung" },
                new User { UserName = "j.weber@checkin.de",    Email = "j.weber@checkin.de",    EmailConfirmed = true, FirstName = "Jonas",  LastName = "Weber",    Abteilung = "Administration" },
                new User { UserName = "l.fischer@checkin.de",  Email = "l.fischer@checkin.de",  EmailConfirmed = true, FirstName = "Laura",  LastName = "Fischer",  Abteilung = "Administration" },
                new User { UserName = "m.wagner@checkin.de",   Email = "m.wagner@checkin.de",   EmailConfirmed = true, FirstName = "Max",    LastName = "Wagner",   Abteilung = "Kundenservice" },
                new User { UserName = "a.becker@checkin.de",   Email = "a.becker@checkin.de",   EmailConfirmed = true, FirstName = "Anna",   LastName = "Becker",   Abteilung = "Kundenservice" },
                new User { UserName = "t.hoffmann@checkin.de", Email = "t.hoffmann@checkin.de", EmailConfirmed = true, FirstName = "Tim",    LastName = "Hoffmann", Abteilung = "Vertrieb" },
                new User { UserName = "j.koch@checkin.de",     Email = "j.koch@checkin.de",     EmailConfirmed = true, FirstName = "Julia",  LastName = "Koch",     Abteilung = "Vertrieb" },
            };

            foreach (var user in users)
            {
                var vorhanden = await userManager.FindByEmailAsync(user.Email!);
                if (vorhanden != null)
                {
                    // Bestandsdaten auf die aktuellen Abteilungsnamen umstellen
                    if (vorhanden.Abteilung != user.Abteilung)
                    {
                        vorhanden.Abteilung = user.Abteilung;
                        await userManager.UpdateAsync(vorhanden);
                    }
                    continue;
                }

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

        // Fiktive Demodaten: Werktage des gesamten Jahres 2026, deterministisch erzeugt.
        // Idempotent: fehlende Tage werden ergänzt, vorhandene Einträge bleiben unberührt.
        public static async Task SeedCheckInsAsync(AppDbContext context, UserManager<User> userManager)
        {
            const int jahr = 2026;

            var mitarbeiter = (await userManager.GetUsersInRoleAsync("Mitarbeiter"))
                .OrderBy(u => u.Email)
                .ToList();

            var vorhanden = (await context.CheckIns
                    .Where(c => c.Timestamp.Year == jahr)
                    .Select(c => new { c.UserId, c.Timestamp })
                    .ToListAsync())
                .Select(c => (c.UserId, c.Timestamp.Date))
                .ToHashSet();

            var checkIns = new List<CheckIn>();

            for (var u = 0; u < mitarbeiter.Count; u++)
            {
                var user = mitarbeiter[u];
                var rnd = new Random(2026 * 100 + u);

                // Jeder Mitarbeiter hat einen eigenen Schwerpunkt (Anteil Office / Home Office)
                var officeAnteil = 0.45 + (u % 4) * 0.12;

                // Zwei Urlaubsblöcke pro Mitarbeiter (Sommer + Winter), je 5-10 Werktage
                var urlaub = new List<(DateTime Start, int Tage)>
                {
                    (new DateTime(jahr, 7, 6).AddDays(u * 7 % 35), 5 + rnd.Next(6)),
                    (new DateTime(jahr, 12, 14).AddDays(u % 3), 5 + rnd.Next(4)),
                };

                for (var tag = new DateTime(jahr, 1, 1); tag.Year == jahr; tag = tag.AddDays(1))
                {
                    if (tag.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday) continue;
                    if (vorhanden.Contains((user.Id, tag))) continue;

                    var imUrlaub = urlaub.Any(b => tag >= b.Start && tag < b.Start.AddDays(b.Tage * 7 / 5 + 1));
                    var zufall = rnd.NextDouble();

                    AttendanceStatus status;
                    if (imUrlaub || zufall < 0.03) status = AttendanceStatus.Abwesend;       // Urlaub / krank
                    else if (zufall < 0.03 + officeAnteil * 0.97) status = AttendanceStatus.Office;
                    else status = AttendanceStatus.HomeOffice;

                    checkIns.Add(new CheckIn
                    {
                        UserId = user.Id,
                        Status = status,
                        Timestamp = tag.AddHours(7).AddMinutes(rnd.Next(30, 150)),
                    });
                }
            }

            if (checkIns.Count == 0) return;

            await context.CheckIns.AddRangeAsync(checkIns);
            await context.SaveChangesAsync();
        }
    }
}
