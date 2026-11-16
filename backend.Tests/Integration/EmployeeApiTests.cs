using System.Net;
using System.Net.Http.Json;
using backend.Models;
using backend.Tests.Support;

namespace backend.Tests.Integration;

public class EmployeeApiTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public EmployeeApiTests(ApiFactory factory) => _factory = factory;

    private static string NewEmail() => $"{Guid.NewGuid():N}@test.de";

    private async Task<(HttpClient client, string userId)> EmployeeAsync()
    {
        var email = NewEmail();
        var user = await _factory.CreateUserAsync(email, "Mitarbeiter", "Eva", "Employee", "Alpha");
        return (await _factory.LoginClientAsync(email), user.Id);
    }

    [Fact]
    public async Task Without_an_entry_today_the_check_in_status_is_not_found()
    {
        var (client, _) = await EmployeeAsync();

        var response = await client.GetAsync("/api/CheckIn/checkin");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Checking_in_stores_the_status_and_reports_it_back()
    {
        var (client, userId) = await EmployeeAsync();

        var response = await client.PostAsJsonAsync("/api/CheckIn/set-status", new { status = "Office" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.ReadJsonAsync();
        Assert.Equal("Office", json.GetProperty("status").GetString());
        Assert.False(json.GetProperty("alreadyCheckedIn").GetBoolean());
        Assert.Equal(1, await _factory.CountCheckInsAsync(userId));
    }

    [Fact]
    public async Task After_checking_in_the_status_endpoint_reports_already_checked_in()
    {
        var (client, _) = await EmployeeAsync();
        await client.PostAsJsonAsync("/api/CheckIn/set-status", new { status = "HomeOffice" });

        var json = await (await client.GetAsync("/api/CheckIn/checkin")).ReadJsonAsync();

        Assert.True(json.GetProperty("alreadyCheckedIn").GetBoolean());
        Assert.Equal("HomeOffice", json.GetProperty("status").GetString());
    }

    [Fact]
    public async Task A_second_check_in_on_the_same_day_does_not_change_the_status()
    {
        var (client, userId) = await EmployeeAsync();
        await client.PostAsJsonAsync("/api/CheckIn/set-status", new { status = "Office" });

        var second = await client.PostAsJsonAsync("/api/CheckIn/set-status", new { status = "Abwesend" });

        var json = await second.ReadJsonAsync();
        Assert.True(json.GetProperty("alreadyCheckedIn").GetBoolean());
        Assert.Equal("Office", json.GetProperty("status").GetString());
        Assert.Equal(1, await _factory.CountCheckInsAsync(userId));
    }

    [Fact]
    public async Task An_invalid_status_is_rejected()
    {
        var (client, userId) = await EmployeeAsync();

        var response = await client.PostAsJsonAsync("/api/CheckIn/set-status", new { status = "Urlaub" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, await _factory.CountCheckInsAsync(userId));
    }

    // Regression: vorab erzeugte Zukunftseinträge dürfen die Statusabfrage von heute nicht verfälschen
    [Fact]
    public async Task Future_entries_do_not_hide_the_check_in_of_today()
    {
        var (client, userId) = await EmployeeAsync();
        await client.PostAsJsonAsync("/api/CheckIn/set-status", new { status = "Office" });
        await _factory.AddCheckInAsync(userId, AttendanceStatus.Abwesend, DateTime.UtcNow.AddDays(20));

        var json = await (await client.GetAsync("/api/CheckIn/checkin")).ReadJsonAsync();

        Assert.True(json.GetProperty("alreadyCheckedIn").GetBoolean());
        Assert.Equal("Office", json.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Admins_cannot_use_the_employee_check_in()
    {
        var email = NewEmail();
        await _factory.CreateUserAsync(email, "Admin");
        var client = await _factory.LoginClientAsync(email);

        var response = await client.PostAsJsonAsync("/api/CheckIn/set-status", new { status = "Office" });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task My_stats_only_count_my_own_check_ins()
    {
        var (client, userId) = await EmployeeAsync();
        var anderer = await _factory.CreateUserAsync(NewEmail());
        await _factory.AddCheckInAsync(userId, AttendanceStatus.Office, new DateTime(2026, 5, 4, 8, 0, 0));
        await _factory.AddCheckInAsync(userId, AttendanceStatus.HomeOffice, new DateTime(2026, 5, 5, 8, 0, 0));
        await _factory.AddCheckInAsync(anderer.Id, AttendanceStatus.Office, new DateTime(2026, 5, 4, 8, 0, 0));

        var json = await (await client.GetAsync("/api/CheckIn/stats/me?monat=5&jahr=2026")).ReadJsonAsync();

        Assert.Equal(2, json.GetProperty("total").GetInt32());
        Assert.Equal(1, json.GetProperty("officeCount").GetInt32());
        Assert.Equal(1, json.GetProperty("homeOfficeCount").GetInt32());
    }
}
