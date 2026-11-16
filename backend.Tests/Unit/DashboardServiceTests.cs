using backend.Models;
using backend.Services;
using backend.Tests.Support;

namespace backend.Tests.Unit;

public class DashboardServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly DashboardService _service;

    // Kalender 2026: 02.11. ist ein Montag (ISO-Woche 45), 05.10. ein Montag (ISO-Woche 41)
    private static readonly DateTime Montag = new(2026, 11, 2);

    private User _anna = null!;   // Alpha
    private User _ben = null!;    // Alpha
    private User _cleo = null!;   // Beta
    private User _admin = null!;

    public DashboardServiceTests()
    {
        _service = new DashboardService(_db.Context, _db.Users);
    }

    public void Dispose() => _db.Dispose();

    private async Task SeedAsync()
    {
        _anna = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        _ben = await _db.AddUserAsync("ben@test.de", "Ben", "Berg", "Alpha");
        _cleo = await _db.AddUserAsync("cleo@test.de", "Cleo", "Claus", "Beta");
        _admin = await _db.AddUserAsync("admin@test.de", "Max", "Mustermann", "", "Admin");

        var morgens = TimeSpan.FromHours(8.5);

        // Montag 02.11.
        await _db.AddCheckInAsync(_anna, AttendanceStatus.Office, Montag + morgens);
        await _db.AddCheckInAsync(_ben, AttendanceStatus.HomeOffice, Montag + morgens);
        await _db.AddCheckInAsync(_cleo, AttendanceStatus.Office, Montag + morgens);
        // Dienstag 03.11.
        await _db.AddCheckInAsync(_anna, AttendanceStatus.Office, Montag.AddDays(1) + morgens);
        await _db.AddCheckInAsync(_ben, AttendanceStatus.Abwesend, Montag.AddDays(1) + morgens);
        await _db.AddCheckInAsync(_cleo, AttendanceStatus.HomeOffice, Montag.AddDays(1) + morgens);
        // Mittwoch 04.11.
        await _db.AddCheckInAsync(_anna, AttendanceStatus.Office, Montag.AddDays(2) + morgens);
        // Oktober (anderer Monat)
        await _db.AddCheckInAsync(_anna, AttendanceStatus.HomeOffice, new DateTime(2026, 10, 5) + morgens);
    }

    // ---------- Übersicht ----------

    [Fact]
    public async Task Overview_counts_every_status_in_the_period()
    {
        await SeedAsync();

        var result = await _service.GetOverviewAsync(new DateTime(2026, 11, 1), new DateTime(2026, 11, 30), null, null);

        Assert.Equal(4, result.Gesamt.Office);
        Assert.Equal(2, result.Gesamt.HomeOffice);
        Assert.Equal(1, result.Gesamt.Abwesend);
        Assert.Equal(7, result.Gesamt.Total);
    }

    [Fact]
    public async Task Overview_includes_the_end_date_itself()
    {
        await SeedAsync();

        // Mittwoch 04.11. hat einen Eintrag um 08:30: bis = 04.11. muss ihn noch enthalten, bis = 03.11. nicht
        var mitMittwoch = await _service.GetOverviewAsync(Montag, new DateTime(2026, 11, 4), null, null);
        var ohneMittwoch = await _service.GetOverviewAsync(Montag, new DateTime(2026, 11, 3), null, null);

        Assert.Equal(7, mitMittwoch.Gesamt.Total);
        Assert.Equal(6, ohneMittwoch.Gesamt.Total);
    }

    [Fact]
    public async Task Overview_excludes_entries_outside_the_period()
    {
        await SeedAsync();

        var result = await _service.GetOverviewAsync(new DateTime(2026, 10, 1), new DateTime(2026, 10, 31), null, null);

        Assert.Equal(1, result.Gesamt.Total);
        Assert.Equal(1, result.Gesamt.HomeOffice);
    }

    [Fact]
    public async Task Overview_returns_weekdays_monday_to_friday_in_order()
    {
        await SeedAsync();

        var result = await _service.GetOverviewAsync(new DateTime(2026, 11, 1), new DateTime(2026, 11, 30), null, null);

        Assert.Equal(new[] { "Mo", "Di", "Mi", "Do", "Fr" }, result.Wochentage.Select(w => w.Label));
        Assert.Equal(new[] { 3, 3, 1, 0, 0 }, result.Wochentage.Select(w => w.Total));
    }

    [Fact]
    public async Task Overview_filters_by_department_but_keeps_all_departments_in_the_comparison()
    {
        await SeedAsync();

        var result = await _service.GetOverviewAsync(new DateTime(2026, 11, 1), new DateTime(2026, 11, 30), "Alpha", null);

        Assert.Equal(5, result.Gesamt.Total); // Anna 3 + Ben 2
        Assert.Equal(new[] { "Alpha", "Beta" }, result.Abteilungen.Select(a => a.Label));
    }

    [Fact]
    public async Task Overview_filters_by_user()
    {
        await SeedAsync();

        var result = await _service.GetOverviewAsync(new DateTime(2026, 11, 1), new DateTime(2026, 11, 30), null, _ben.Id);

        Assert.Equal(2, result.Gesamt.Total);
        Assert.Equal(1, result.Gesamt.HomeOffice);
        Assert.Equal(1, result.Gesamt.Abwesend);
    }

    [Fact]
    public async Task Overview_department_comparison_counts_per_department_and_sorts_by_name()
    {
        await SeedAsync();

        var result = await _service.GetOverviewAsync(new DateTime(2026, 11, 1), new DateTime(2026, 11, 30), null, null);

        var alpha = result.Abteilungen[0];
        Assert.Equal("Alpha", alpha.Label);
        Assert.Equal((3, 1, 1), (alpha.Office, alpha.HomeOffice, alpha.Abwesend));

        var beta = result.Abteilungen[1];
        Assert.Equal("Beta", beta.Label);
        Assert.Equal((1, 1, 0), (beta.Office, beta.HomeOffice, beta.Abwesend));
    }

    [Fact]
    public async Task Overview_department_comparison_skips_users_without_a_department()
    {
        await SeedAsync();
        await _db.AddCheckInAsync(_admin, AttendanceStatus.Office, Montag + TimeSpan.FromHours(9));

        var result = await _service.GetOverviewAsync(new DateTime(2026, 11, 1), new DateTime(2026, 11, 30), null, null);

        Assert.DoesNotContain(result.Abteilungen, a => string.IsNullOrEmpty(a.Label));
    }

    [Fact]
    public async Task Overview_ranking_orders_by_office_days_and_ignores_other_statuses()
    {
        await SeedAsync();

        var result = await _service.GetOverviewAsync(new DateTime(2026, 11, 1), new DateTime(2026, 11, 30), null, null);

        Assert.Equal(new[] { "Anna Adler", "Cleo Claus" }, result.Ranking.Select(r => r.Name));
        Assert.Equal(new[] { 3, 1 }, result.Ranking.Select(r => r.Office));
        Assert.DoesNotContain(result.Ranking, r => r.Name == "Ben Berg"); // nie im Office
    }

    [Fact]
    public async Task Overview_ranking_is_limited_to_five_entries()
    {
        for (var i = 1; i <= 7; i++)
        {
            var user = await _db.AddUserAsync($"u{i}@test.de", $"User{i}", $"Nachname{i}", "Alpha");
            await _db.AddCheckInAsync(user, AttendanceStatus.Office, Montag + TimeSpan.FromHours(8));
        }

        var result = await _service.GetOverviewAsync(Montag, Montag.AddDays(6), null, null);

        Assert.Equal(5, result.Ranking.Count);
    }

    [Fact]
    public async Task Overview_without_data_returns_zeroes_and_empty_lists()
    {
        var result = await _service.GetOverviewAsync(new DateTime(2026, 1, 1), new DateTime(2026, 1, 31), null, null);

        Assert.Equal(0, result.Gesamt.Total);
        Assert.Empty(result.Abteilungen);
        Assert.Empty(result.Ranking);
        Assert.Equal(5, result.Wochentage.Count);
    }

    // ---------- Verlauf ----------

    [Fact]
    public async Task Verlauf_returns_twelve_months_with_german_labels()
    {
        await SeedAsync();

        var result = await _service.GetVerlaufAsync(2026, null, null);

        Assert.Equal(12, result.Count);
        Assert.Equal("Jan", result[0].Label);
        Assert.Equal("Mär", result[2].Label);
        Assert.Equal("Dez", result[11].Label);
    }

    [Fact]
    public async Task Verlauf_counts_each_month_separately()
    {
        await SeedAsync();

        var result = await _service.GetVerlaufAsync(2026, null, null);

        Assert.Equal(7, result[10].Total);  // November
        Assert.Equal(4, result[10].Office);
        Assert.Equal(1, result[9].Total);   // Oktober
        Assert.Equal(0, result[0].Total);   // Januar
    }

    [Fact]
    public async Task Verlauf_ignores_other_years()
    {
        await SeedAsync();
        await _db.AddCheckInAsync(_anna, AttendanceStatus.Office, new DateTime(2025, 11, 3, 8, 0, 0));

        var result = await _service.GetVerlaufAsync(2026, null, null);

        Assert.Equal(7, result[10].Total);
    }

    [Fact]
    public async Task Verlauf_filters_by_user()
    {
        await SeedAsync();

        var result = await _service.GetVerlaufAsync(2026, null, _cleo.Id);

        Assert.Equal(2, result[10].Total);
        Assert.Equal(0, result[9].Total);
    }

    // ---------- Heatmap ----------

    [Fact]
    public async Task Heatmap_returns_52_weeks()
    {
        var result = await _service.GetHeatmapAsync(2026, null, null);

        Assert.Equal(52, result.Count);
        Assert.Equal(Enumerable.Range(1, 52), result.Select(w => w.Woche));
    }

    [Fact]
    public async Task Heatmap_groups_by_iso_week_and_counts_office_days()
    {
        await SeedAsync();

        var result = await _service.GetHeatmapAsync(2026, null, null);

        var kw45 = result.Single(w => w.Woche == 45);
        Assert.Equal(7, kw45.Total);
        Assert.Equal(4, kw45.Office);

        var kw41 = result.Single(w => w.Woche == 41);
        Assert.Equal(1, kw41.Total);
        Assert.Equal(0, kw41.Office);

        Assert.Equal(0, result.Single(w => w.Woche == 10).Total);
    }

    // ---------- Wochenraster ----------

    [Fact]
    public async Task TeamWoche_lists_only_employees_sorted_by_department_then_last_name()
    {
        await SeedAsync();

        var result = await _service.GetTeamWocheAsync(Montag, null);

        Assert.Equal(new[] { "Anna Adler", "Ben Berg", "Cleo Claus" }, result.Select(r => r.Name));
        Assert.DoesNotContain(result, r => r.Name.Contains("Mustermann"));
    }

    [Fact]
    public async Task TeamWoche_puts_each_status_on_the_right_weekday()
    {
        await SeedAsync();

        var anna = (await _service.GetTeamWocheAsync(Montag, null)).Single(r => r.Name == "Anna Adler");

        Assert.Equal(5, anna.Tage.Length);
        Assert.Equal(new string?[] { "Office", "Office", "Office", null, null }, anna.Tage);

        var ben = (await _service.GetTeamWocheAsync(Montag, null)).Single(r => r.Name == "Ben Berg");
        Assert.Equal(new string?[] { "HomeOffice", "Abwesend", null, null, null }, ben.Tage);
    }

    [Fact]
    public async Task TeamWoche_ignores_weekend_and_other_weeks()
    {
        await SeedAsync();
        await _db.AddCheckInAsync(_cleo, AttendanceStatus.Office, new DateTime(2026, 11, 7, 9, 0, 0));  // Samstag
        await _db.AddCheckInAsync(_cleo, AttendanceStatus.Office, new DateTime(2026, 11, 9, 9, 0, 0));  // nächster Montag

        var cleo = (await _service.GetTeamWocheAsync(Montag, null)).Single(r => r.Name == "Cleo Claus");

        Assert.Equal(new string?[] { "Office", "HomeOffice", null, null, null }, cleo.Tage);
    }

    [Fact]
    public async Task TeamWoche_filters_by_department()
    {
        await SeedAsync();

        var result = await _service.GetTeamWocheAsync(Montag, "Beta");

        Assert.Single(result);
        Assert.Equal("Cleo Claus", result[0].Name);
    }
}
