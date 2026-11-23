using backend.Data;
using backend.Models;
using backend.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace backend.Tests.Unit;

public class SeedDataTests
{
    private static readonly string[] NeueAbteilungen =
        { "Administration", "Kundenservice", "Softwareentwicklung", "Vertrieb" };

    private static async Task<TestDb> SeededAsync()
    {
        var db = new TestDb();
        await SeedData.SeedAdminAsync(db.Users, db.Roles);
        await SeedData.SeedUsersAsync(db.Users);
        await SeedData.SeedCheckInsAsync(db.Context, db.Users);
        return db;
    }

    private static int Werktage(int jahr)
    {
        var count = 0;
        for (var d = new DateTime(jahr, 1, 1); d.Year == jahr; d = d.AddDays(1))
            if (d.DayOfWeek is not (DayOfWeek.Saturday or DayOfWeek.Sunday)) count++;
        return count;
    }

    [Fact]
    public async Task Seed_creates_both_roles_and_the_admin_account()
    {
        using var db = new TestDb();

        await SeedData.SeedAdminAsync(db.Users, db.Roles);

        Assert.True(await db.Roles.RoleExistsAsync("Admin"));
        Assert.True(await db.Roles.RoleExistsAsync("Mitarbeiter"));
        var admin = await db.Users.FindByEmailAsync("admin@checkin.de");
        Assert.NotNull(admin);
        Assert.True(await db.Users.IsInRoleAsync(admin!, "Admin"));
    }

    [Fact]
    public async Task Seed_creates_eight_employees_with_the_current_department_names()
    {
        using var db = await SeededAsync();

        var mitarbeiter = await db.Users.GetUsersInRoleAsync("Mitarbeiter");

        Assert.Equal(8, mitarbeiter.Count);
        Assert.Equal(NeueAbteilungen, mitarbeiter.Select(m => m.Abteilung).Distinct().OrderBy(a => a));
    }

    [Fact]
    public async Task Seed_does_not_use_the_old_department_names()
    {
        using var db = await SeededAsync();

        var abteilungen = db.Users.Users.Select(u => u.Abteilung).ToList();

        Assert.DoesNotContain("Entwicklung", abteilungen);
        Assert.DoesNotContain("IT-Infrastruktur", abteilungen);
        Assert.DoesNotContain("Support", abteilungen);
    }

    [Fact]
    public async Task Seed_moves_existing_employees_to_the_new_department_names()
    {
        using var db = new TestDb();
        await SeedData.SeedAdminAsync(db.Users, db.Roles);
        await db.AddUserAsync("l.mueller@checkin.de", "Lukas", "Müller", "Entwicklung");

        await SeedData.SeedUsersAsync(db.Users);

        var lukas = await db.Users.FindByEmailAsync("l.mueller@checkin.de");
        Assert.Equal("Softwareentwicklung", lukas!.Abteilung);
    }

    [Fact]
    public async Task Seed_creates_a_check_in_for_every_weekday_of_2026_for_every_employee()
    {
        using var db = await SeededAsync();

        var proPerson = await db.Context.CheckIns
            .GroupBy(c => c.UserId)
            .Select(g => g.Count())
            .ToListAsync();

        Assert.Equal(8, proPerson.Count);
        Assert.All(proPerson, anzahl => Assert.Equal(Werktage(2026), anzahl));
    }

    [Fact]
    public async Task Seed_only_creates_weekdays_inside_2026()
    {
        using var db = await SeededAsync();

        var zeitpunkte = await db.Context.CheckIns.Select(c => c.Timestamp).ToListAsync();

        Assert.All(zeitpunkte, t =>
        {
            Assert.Equal(2026, t.Year);
            Assert.NotEqual(DayOfWeek.Saturday, t.DayOfWeek);
            Assert.NotEqual(DayOfWeek.Sunday, t.DayOfWeek);
        });
    }

    [Fact]
    public async Task Seed_never_creates_two_entries_for_the_same_person_and_day()
    {
        using var db = await SeededAsync();

        var doppelt = (await db.Context.CheckIns.Select(c => new { c.UserId, c.Timestamp }).ToListAsync())
            .GroupBy(c => (c.UserId, c.Timestamp.Date))
            .Count(g => g.Count() > 1);

        Assert.Equal(0, doppelt);
    }

    [Fact]
    public async Task Seed_is_idempotent()
    {
        using var db = await SeededAsync();
        var vorher = await db.Context.CheckIns.CountAsync();
        var nutzerVorher = db.Users.Users.Count();

        await SeedData.SeedAdminAsync(db.Users, db.Roles);
        await SeedData.SeedUsersAsync(db.Users);
        await SeedData.SeedCheckInsAsync(db.Context, db.Users);

        Assert.Equal(vorher, await db.Context.CheckIns.CountAsync());
        Assert.Equal(nutzerVorher, db.Users.Users.Count());
    }

    [Fact]
    public async Task Seed_fills_only_missing_days_and_keeps_existing_entries()
    {
        using var db = new TestDb();
        await SeedData.SeedAdminAsync(db.Users, db.Roles);
        await SeedData.SeedUsersAsync(db.Users);
        var lukas = (await db.Users.FindByEmailAsync("l.mueller@checkin.de"))!;
        await db.AddCheckInAsync(lukas, AttendanceStatus.Abwesend, new DateTime(2026, 3, 3, 7, 0, 0));

        await SeedData.SeedCheckInsAsync(db.Context, db.Users);

        var amTag = await db.Context.CheckIns
            .Where(c => c.UserId == lukas.Id && c.Timestamp >= new DateTime(2026, 3, 3) && c.Timestamp < new DateTime(2026, 3, 4))
            .ToListAsync();
        var eintrag = Assert.Single(amTag);
        Assert.Equal(AttendanceStatus.Abwesend, eintrag.Status);
    }

    [Fact]
    public async Task Seed_data_is_deterministic()
    {
        using var erste = await SeededAsync();
        using var zweite = await SeededAsync();

        async Task<List<string>> Zeilen(TestDb db) =>
            (await db.Context.CheckIns.Include(c => c.User).ToListAsync())
                .OrderBy(c => c.User.Email).ThenBy(c => c.Timestamp)
                .Select(c => $"{c.User.Email}|{c.Timestamp:O}|{c.Status}")
                .ToList();

        Assert.Equal(await Zeilen(erste), await Zeilen(zweite));
    }

    [Fact]
    public async Task Seed_contains_all_three_statuses()
    {
        using var db = await SeededAsync();

        var stati = await db.Context.CheckIns.Select(c => c.Status).Distinct().ToListAsync();

        Assert.Contains(AttendanceStatus.Office, stati);
        Assert.Contains(AttendanceStatus.HomeOffice, stati);
        Assert.Contains(AttendanceStatus.Abwesend, stati);
    }
}
