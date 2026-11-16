using backend.Models;
using backend.Services;
using backend.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace backend.Tests.Unit;

public class UserServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly UserService _service;

    public UserServiceTests()
    {
        _service = new UserService(_db.Users, _db.Context);
    }

    public void Dispose() => _db.Dispose();

    // ---------- Nachtragen / Korrigieren ----------

    [Fact]
    public async Task AdminSetCheckIn_creates_an_entry_for_the_given_day()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");

        var result = await _service.AdminSetCheckInAsync(user.Id, new DateTime(2026, 11, 2), AttendanceStatus.Office, overwrite: false);

        Assert.NotNull(result);
        Assert.True(result!.Gespeichert);
        Assert.Equal("2026-11-02", result.Datum);
        Assert.Null(result.BestehenderStatus);

        var saved = await _db.Context.CheckIns.SingleAsync();
        Assert.Equal(new DateTime(2026, 11, 2), saved.Timestamp.Date);
        Assert.Equal(AttendanceStatus.Office, saved.Status);
    }

    [Fact]
    public async Task AdminSetCheckIn_without_overwrite_keeps_an_existing_entry_and_reports_its_status()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        await _db.AddCheckInAsync(user, AttendanceStatus.HomeOffice, new DateTime(2026, 11, 2, 8, 0, 0));

        var result = await _service.AdminSetCheckInAsync(user.Id, new DateTime(2026, 11, 2), AttendanceStatus.Office, overwrite: false);

        Assert.False(result!.Gespeichert);
        Assert.Equal(AttendanceStatus.HomeOffice, result.BestehenderStatus);
        Assert.Equal(AttendanceStatus.HomeOffice, (await _db.Context.CheckIns.SingleAsync()).Status);
    }

    [Fact]
    public async Task AdminSetCheckIn_with_overwrite_replaces_the_status_without_a_duplicate()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        await _db.AddCheckInAsync(user, AttendanceStatus.HomeOffice, new DateTime(2026, 11, 2, 8, 0, 0));

        var result = await _service.AdminSetCheckInAsync(user.Id, new DateTime(2026, 11, 2), AttendanceStatus.Abwesend, overwrite: true);

        Assert.True(result!.Gespeichert);
        var saved = await _db.Context.CheckIns.SingleAsync();
        Assert.Equal(AttendanceStatus.Abwesend, saved.Status);
    }

    [Fact]
    public async Task AdminSetCheckIn_returns_null_for_an_unknown_user()
    {
        var result = await _service.AdminSetCheckInAsync("gibt-es-nicht", new DateTime(2026, 11, 2), AttendanceStatus.Office, false);

        Assert.Null(result);
        Assert.Empty(_db.Context.CheckIns);
    }

    [Fact]
    public async Task AdminSetCheckIn_without_a_date_uses_today()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");

        var result = await _service.AdminSetCheckInAsync(user.Id, null, AttendanceStatus.Office, false);

        Assert.Equal(DateTime.UtcNow.Date.ToString("yyyy-MM-dd"), result!.Datum);
    }

    [Fact]
    public async Task AdminSetCheckIn_only_touches_the_selected_user()
    {
        var anna = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        var ben = await _db.AddUserAsync("ben@test.de", "Ben", "Berg", "Alpha");
        await _db.AddCheckInAsync(ben, AttendanceStatus.HomeOffice, new DateTime(2026, 11, 2, 8, 0, 0));

        var result = await _service.AdminSetCheckInAsync(anna.Id, new DateTime(2026, 11, 2), AttendanceStatus.Office, false);

        Assert.True(result!.Gespeichert); // Bens Eintrag am selben Tag stört nicht
        Assert.Equal(2, await _db.Context.CheckIns.CountAsync());
    }

    // ---------- Einträge einer Person ----------

    [Fact]
    public async Task GetCheckIns_returns_entries_in_the_range_newest_first()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        await _db.AddCheckInAsync(user, AttendanceStatus.Office, new DateTime(2026, 11, 2, 8, 0, 0));
        await _db.AddCheckInAsync(user, AttendanceStatus.HomeOffice, new DateTime(2026, 11, 4, 8, 0, 0));
        await _db.AddCheckInAsync(user, AttendanceStatus.Abwesend, new DateTime(2026, 11, 30, 8, 0, 0));
        await _db.AddCheckInAsync(user, AttendanceStatus.Office, new DateTime(2026, 10, 30, 8, 0, 0)); // davor

        var result = await _service.GetCheckInsAsync(user.Id, new DateTime(2026, 11, 1), new DateTime(2026, 11, 30));

        Assert.Equal(new[] { "2026-11-30", "2026-11-04", "2026-11-02" }, result.Select(r => r.Datum));
        Assert.Equal(AttendanceStatus.Abwesend, result[0].Status);
    }

    [Fact]
    public async Task GetCheckIns_does_not_return_other_users_entries()
    {
        var anna = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        var ben = await _db.AddUserAsync("ben@test.de", "Ben", "Berg", "Alpha");
        await _db.AddCheckInAsync(ben, AttendanceStatus.Office, new DateTime(2026, 11, 2, 8, 0, 0));

        var result = await _service.GetCheckInsAsync(anna.Id, new DateTime(2026, 11, 1), new DateTime(2026, 11, 30));

        Assert.Empty(result);
    }

    // ---------- Mitarbeiterliste ----------

    [Fact]
    public async Task GetMitarbeiter_excludes_admins()
    {
        await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        await _db.AddUserAsync("admin@test.de", "Max", "Mustermann", "", "Admin");

        var result = await _service.GetMitarbeiterAsync();

        Assert.Single(result);
        Assert.Equal("anna@test.de", result[0].Email);
    }

    // ---------- Export ----------

    [Fact]
    public async Task Export_formats_the_date_and_filters_by_department_and_month()
    {
        var anna = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        var cleo = await _db.AddUserAsync("cleo@test.de", "Cleo", "Claus", "Beta");
        await _db.AddCheckInAsync(anna, AttendanceStatus.Office, new DateTime(2026, 11, 2, 8, 0, 0));
        await _db.AddCheckInAsync(anna, AttendanceStatus.Office, new DateTime(2026, 10, 2, 8, 0, 0));
        await _db.AddCheckInAsync(cleo, AttendanceStatus.HomeOffice, new DateTime(2026, 11, 2, 8, 0, 0));

        var result = await _service.GetExportAsync("Alpha", null, 11, 2026);

        var row = Assert.Single(result);
        Assert.Equal("02.11.2026", row.Datum);
        Assert.Equal("Anna", row.Vorname);
        Assert.Equal("Alpha", row.Abteilung);
        Assert.Equal("Office", row.Status);
    }

    [Fact]
    public async Task Export_is_sorted_by_date()
    {
        var anna = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        await _db.AddCheckInAsync(anna, AttendanceStatus.Office, new DateTime(2026, 11, 4, 8, 0, 0));
        await _db.AddCheckInAsync(anna, AttendanceStatus.Office, new DateTime(2026, 11, 2, 8, 0, 0));

        var result = await _service.GetExportAsync(null, null, 11, 2026);

        Assert.Equal(new[] { "02.11.2026", "04.11.2026" }, result.Select(r => r.Datum));
    }
}
