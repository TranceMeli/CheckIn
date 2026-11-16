using backend.Models;
using backend.Services;
using backend.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace backend.Tests.Unit;

public class CheckInServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly CheckInService _service;

    public CheckInServiceTests()
    {
        _service = new CheckInService(_db.Context, _db.Users);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task CheckIn_creates_an_entry_for_today()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");

        var result = await _service.CheckInAsync(user.Id, AttendanceStatus.Office);

        Assert.False(result.AlreadyCheckedIn);
        Assert.Equal(AttendanceStatus.Office, result.Status);
        Assert.Equal("Anna", result.FirstName);
        Assert.Equal(1, await _db.Context.CheckIns.CountAsync());
    }

    [Fact]
    public async Task CheckIn_twice_on_the_same_day_keeps_the_first_status()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        await _service.CheckInAsync(user.Id, AttendanceStatus.Office);

        var second = await _service.CheckInAsync(user.Id, AttendanceStatus.HomeOffice);

        Assert.True(second.AlreadyCheckedIn);
        Assert.Equal(AttendanceStatus.Office, second.Status);
        Assert.Equal(1, await _db.Context.CheckIns.CountAsync());
    }

    [Fact]
    public async Task CheckIn_accepts_the_email_as_identifier()
    {
        await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");

        var result = await _service.CheckInAsync("anna@test.de", AttendanceStatus.HomeOffice);

        Assert.Equal("Anna", result.FirstName);
    }

    [Fact]
    public async Task CheckIn_throws_for_an_unknown_user()
    {
        await Assert.ThrowsAsync<Exception>(() => _service.CheckInAsync("gibt-es-nicht", AttendanceStatus.Office));
    }

    [Fact]
    public async Task GetCurrent_returns_null_without_any_entry()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");

        Assert.Null(await _service.GetCurrentCheckInAsync(user.Id));
    }

    [Fact]
    public async Task GetCurrent_marks_a_check_in_from_today_as_already_checked_in()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        await _db.AddCheckInAsync(user, AttendanceStatus.HomeOffice, DateTime.UtcNow);

        var result = await _service.GetCurrentCheckInAsync(user.Id);

        Assert.True(result!.AlreadyCheckedIn);
        Assert.Equal(AttendanceStatus.HomeOffice, result.Status);
    }

    [Fact]
    public async Task GetCurrent_does_not_mark_yesterdays_check_in_as_today()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        await _db.AddCheckInAsync(user, AttendanceStatus.Office, DateTime.UtcNow.AddDays(-1));

        var result = await _service.GetCurrentCheckInAsync(user.Id);

        Assert.False(result!.AlreadyCheckedIn);
    }

    // Regression: vorab erzeugte Demodaten in der Zukunft dürfen nicht als "letzter Check-in" zählen
    [Fact]
    public async Task GetCurrent_ignores_entries_in_the_future()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        await _db.AddCheckInAsync(user, AttendanceStatus.Office, DateTime.UtcNow);
        await _db.AddCheckInAsync(user, AttendanceStatus.Abwesend, DateTime.UtcNow.AddDays(30));

        var result = await _service.GetCurrentCheckInAsync(user.Id);

        Assert.True(result!.AlreadyCheckedIn);
        Assert.Equal(AttendanceStatus.Office, result.Status);
    }

    [Fact]
    public async Task GetMyStats_counts_the_statuses_of_the_selected_month_only()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        await _db.AddCheckInAsync(user, AttendanceStatus.Office, new DateTime(2026, 11, 2, 8, 0, 0));
        await _db.AddCheckInAsync(user, AttendanceStatus.Office, new DateTime(2026, 11, 3, 8, 0, 0));
        await _db.AddCheckInAsync(user, AttendanceStatus.HomeOffice, new DateTime(2026, 11, 4, 8, 0, 0));
        await _db.AddCheckInAsync(user, AttendanceStatus.Abwesend, new DateTime(2026, 10, 5, 8, 0, 0));

        var stats = await _service.GetMyStatsAsync(user.Id, 11, 2026);

        Assert.Equal(3, stats.Total);
        Assert.Equal(2, stats.OfficeCount);
        Assert.Equal(1, stats.HomeOfficeCount);
        Assert.Equal(0, stats.AbwesendCount);
        Assert.Equal(3, stats.Monthly.Count);
    }

    [Fact]
    public async Task GetMyStats_without_a_month_covers_the_whole_year()
    {
        var user = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        await _db.AddCheckInAsync(user, AttendanceStatus.Office, new DateTime(2026, 3, 2, 8, 0, 0));
        await _db.AddCheckInAsync(user, AttendanceStatus.Office, new DateTime(2026, 11, 2, 8, 0, 0));
        await _db.AddCheckInAsync(user, AttendanceStatus.Office, new DateTime(2025, 11, 2, 8, 0, 0));

        var stats = await _service.GetMyStatsAsync(user.Id, null, 2026);

        Assert.Equal(2, stats.Total);
    }

    [Fact]
    public async Task GetMyStats_does_not_count_other_users()
    {
        var anna = await _db.AddUserAsync("anna@test.de", "Anna", "Adler", "Alpha");
        var ben = await _db.AddUserAsync("ben@test.de", "Ben", "Berg", "Alpha");
        await _db.AddCheckInAsync(ben, AttendanceStatus.Office, new DateTime(2026, 11, 2, 8, 0, 0));

        var stats = await _service.GetMyStatsAsync(anna.Id, 11, 2026);

        Assert.Equal(0, stats.Total);
    }
}
