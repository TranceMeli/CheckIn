using System.Net;
using System.Text.Json;
using backend.Models;
using backend.Tests.Support;

namespace backend.Tests.Integration;

public class DashboardApiTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public DashboardApiTests(ApiFactory factory) => _factory = factory;

    private static string NewEmail() => $"{Guid.NewGuid():N}@test.de";

    private async Task<(HttpClient client, string email)> AdminAsync()
    {
        var email = NewEmail();
        await _factory.CreateUserAsync(email, "Admin", "Max", "Mustermann", "");
        return (await _factory.LoginClientAsync(email), email);
    }

    // ---------- Rechte ----------

    [Theory]
    [InlineData("/api/Dashboard/overview?von=2026-11-01&bis=2026-11-30")]
    [InlineData("/api/Dashboard/verlauf?jahr=2026")]
    [InlineData("/api/Dashboard/heatmap?jahr=2026")]
    [InlineData("/api/Dashboard/team-woche?montag=2026-11-02")]
    public async Task Employees_cannot_open_the_admin_dashboard_endpoints(string url)
    {
        var email = NewEmail();
        await _factory.CreateUserAsync(email);
        var client = await _factory.LoginClientAsync(email);

        var response = await client.GetAsync(url);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admins_cannot_open_the_employee_dashboard_endpoints()
    {
        var (client, _) = await AdminAsync();

        var response = await client.GetAsync("/api/CheckIn/dashboard/overview?von=2026-11-01&bis=2026-11-30");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ---------- Admin-Auswertung ----------

    [Fact]
    public async Task Overview_returns_the_expected_shape_for_admins()
    {
        var (client, _) = await AdminAsync();

        var response = await client.GetAsync("/api/Dashboard/overview?von=2026-11-01&bis=2026-11-30");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.ReadJsonAsync();
        Assert.True(json.TryGetProperty("gesamt", out _));
        Assert.Equal(5, json.GetProperty("wochentage").GetArrayLength());
        Assert.True(json.TryGetProperty("abteilungen", out _));
        Assert.True(json.TryGetProperty("ranking", out _));
    }

    [Fact]
    public async Task Overview_rejects_an_end_date_before_the_start_date()
    {
        var (client, _) = await AdminAsync();

        var response = await client.GetAsync("/api/Dashboard/overview?von=2026-11-30&bis=2026-11-01");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Overview_counts_real_check_ins_and_respects_the_department_filter()
    {
        var abteilung = $"Abt-{Guid.NewGuid():N}";
        var anna = await _factory.CreateUserAsync(NewEmail(), "Mitarbeiter", "Anna", "Adler", abteilung);
        var ben = await _factory.CreateUserAsync(NewEmail(), "Mitarbeiter", "Ben", "Berg", abteilung);
        await _factory.AddCheckInAsync(anna.Id, AttendanceStatus.Office, new DateTime(2026, 6, 2, 8, 0, 0));
        await _factory.AddCheckInAsync(ben.Id, AttendanceStatus.HomeOffice, new DateTime(2026, 6, 2, 8, 0, 0));
        var (client, _) = await AdminAsync();

        var response = await client.GetAsync($"/api/Dashboard/overview?von=2026-06-01&bis=2026-06-30&abteilung={abteilung}");

        var gesamt = (await response.ReadJsonAsync()).GetProperty("gesamt");
        Assert.Equal(1, gesamt.GetProperty("office").GetInt32());
        Assert.Equal(1, gesamt.GetProperty("homeOffice").GetInt32());
        Assert.Equal(2, gesamt.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task Verlauf_returns_twelve_months()
    {
        var (client, _) = await AdminAsync();

        var json = await (await client.GetAsync("/api/Dashboard/verlauf?jahr=2026")).ReadJsonAsync();

        Assert.Equal(12, json.GetArrayLength());
        Assert.Equal("Jan", json[0].GetProperty("label").GetString());
    }

    [Fact]
    public async Task Heatmap_returns_52_weeks()
    {
        var (client, _) = await AdminAsync();

        var json = await (await client.GetAsync("/api/Dashboard/heatmap?jahr=2026")).ReadJsonAsync();

        Assert.Equal(52, json.GetArrayLength());
    }

    [Fact]
    public async Task Team_week_lists_employees_but_not_admins()
    {
        var abteilung = $"Abt-{Guid.NewGuid():N}";
        var anna = await _factory.CreateUserAsync(NewEmail(), "Mitarbeiter", "Anna", "Adler", abteilung);
        await _factory.AddCheckInAsync(anna.Id, AttendanceStatus.Office, new DateTime(2026, 11, 3, 8, 0, 0));
        var (client, _) = await AdminAsync();

        var json = await (await client.GetAsync($"/api/Dashboard/team-woche?montag=2026-11-02&abteilung={abteilung}")).ReadJsonAsync();

        Assert.Equal(1, json.GetArrayLength());
        Assert.Equal("Anna Adler", json[0].GetProperty("name").GetString());
        Assert.Equal("Office", json[0].GetProperty("tage")[1].GetString()); // Dienstag
        Assert.Equal(JsonValueKind.Null, json[0].GetProperty("tage")[0].ValueKind); // Montag: kein Eintrag

        var alle = await (await client.GetAsync("/api/Dashboard/team-woche?montag=2026-11-02")).ReadJsonAsync();
        Assert.DoesNotContain(alle.EnumerateArray(), e => e.GetProperty("name").GetString() == "Max Mustermann");
    }


    // ---------- Eigene Auswertung (Mitarbeiter) ----------

    [Fact]
    public async Task Employee_overview_only_contains_the_own_check_ins()
    {
        var abteilung = $"Abt-{Guid.NewGuid():N}";
        var email = NewEmail();
        var ich = await _factory.CreateUserAsync(email, "Mitarbeiter", "Ida", "Ich", abteilung);
        var andere = await _factory.CreateUserAsync(NewEmail(), "Mitarbeiter", "Otto", "Other", abteilung);
        await _factory.AddCheckInAsync(ich.Id, AttendanceStatus.Office, new DateTime(2026, 7, 6, 8, 0, 0));
        await _factory.AddCheckInAsync(andere.Id, AttendanceStatus.Office, new DateTime(2026, 7, 6, 8, 0, 0));
        await _factory.AddCheckInAsync(andere.Id, AttendanceStatus.Office, new DateTime(2026, 7, 7, 8, 0, 0));
        var client = await _factory.LoginClientAsync(email);

        var json = await (await client.GetAsync("/api/CheckIn/dashboard/overview?von=2026-07-01&bis=2026-07-31")).ReadJsonAsync();

        Assert.Equal(1, json.GetProperty("gesamt").GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task Employee_overview_never_exposes_other_peoples_ranking_or_department_data()
    {
        var email = NewEmail();
        var ich = await _factory.CreateUserAsync(email);
        var andere = await _factory.CreateUserAsync(NewEmail(), "Mitarbeiter", "Otto", "Other", "Geheim");
        await _factory.AddCheckInAsync(ich.Id, AttendanceStatus.Office, new DateTime(2026, 8, 3, 8, 0, 0));
        await _factory.AddCheckInAsync(andere.Id, AttendanceStatus.Office, new DateTime(2026, 8, 3, 8, 0, 0));
        var client = await _factory.LoginClientAsync(email);

        var response = await client.GetAsync("/api/CheckIn/dashboard/overview?von=2026-08-01&bis=2026-08-31");

        var json = await response.ReadJsonAsync();
        Assert.Equal(0, json.GetProperty("ranking").GetArrayLength());
        Assert.Equal(0, json.GetProperty("abteilungen").GetArrayLength());
        var rohtext = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("Other", rohtext);
        Assert.DoesNotContain("Geheim", rohtext);
    }

    [Fact]
    public async Task Employee_trend_and_heatmap_only_count_the_own_check_ins()
    {
        var email = NewEmail();
        var ich = await _factory.CreateUserAsync(email);
        var andere = await _factory.CreateUserAsync(NewEmail());
        await _factory.AddCheckInAsync(ich.Id, AttendanceStatus.Office, new DateTime(2026, 9, 7, 8, 0, 0));   // KW 37
        await _factory.AddCheckInAsync(andere.Id, AttendanceStatus.Office, new DateTime(2026, 9, 7, 8, 0, 0));
        var client = await _factory.LoginClientAsync(email);

        var verlauf = await (await client.GetAsync("/api/CheckIn/dashboard/verlauf?jahr=2026")).ReadJsonAsync();
        var heatmap = await (await client.GetAsync("/api/CheckIn/dashboard/heatmap?jahr=2026")).ReadJsonAsync();

        Assert.Equal(1, verlauf[8].GetProperty("total").GetInt32());                         // September
        Assert.Equal(1, heatmap.EnumerateArray().Single(w => w.GetProperty("woche").GetInt32() == 37).GetProperty("total").GetInt32());
    }
}
