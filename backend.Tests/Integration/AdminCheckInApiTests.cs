using System.Net;
using System.Net.Http.Json;
using backend.Models;
using backend.Tests.Support;

namespace backend.Tests.Integration;

public class AdminCheckInApiTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public AdminCheckInApiTests(ApiFactory factory) => _factory = factory;

    private static string NewEmail() => $"{Guid.NewGuid():N}@test.de";

    private async Task<HttpClient> AdminClientAsync()
    {
        var email = NewEmail();
        await _factory.CreateUserAsync(email, "Admin", "Max", "Mustermann", "");
        return await _factory.LoginClientAsync(email);
    }

    // ---------- Nachtragen ----------

    [Fact]
    public async Task Admin_can_add_a_check_in_for_a_past_day()
    {
        var user = await _factory.CreateUserAsync(NewEmail());
        var client = await AdminClientAsync();

        var response = await client.PostAsJsonAsync($"/api/User/{user.Id}/checkin", new { status = "Office", datum = "2026-03-02" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.ReadJsonAsync();
        Assert.True(json.GetProperty("gespeichert").GetBoolean());
        Assert.Equal("2026-03-02", json.GetProperty("datum").GetString());
        Assert.Equal(1, await _factory.CountCheckInsAsync(user.Id));
    }

    [Fact]
    public async Task Adding_a_second_check_in_for_the_same_day_is_a_conflict_that_names_the_existing_status()
    {
        var user = await _factory.CreateUserAsync(NewEmail());
        var client = await AdminClientAsync();
        await client.PostAsJsonAsync($"/api/User/{user.Id}/checkin", new { status = "HomeOffice", datum = "2026-03-03" });

        var response = await client.PostAsJsonAsync($"/api/User/{user.Id}/checkin", new { status = "Office", datum = "2026-03-03" });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var json = await response.ReadJsonAsync();
        Assert.False(json.GetProperty("gespeichert").GetBoolean());
        Assert.Equal("HomeOffice", json.GetProperty("bestehenderStatus").GetString());
        Assert.Equal(1, await _factory.CountCheckInsAsync(user.Id));
    }

    [Fact]
    public async Task Admin_can_correct_an_existing_check_in_with_put()
    {
        var user = await _factory.CreateUserAsync(NewEmail());
        var client = await AdminClientAsync();
        await client.PostAsJsonAsync($"/api/User/{user.Id}/checkin", new { status = "HomeOffice", datum = "2026-03-04" });

        var response = await client.PutAsJsonAsync($"/api/User/{user.Id}/checkin", new { status = "Abwesend", datum = "2026-03-04" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(1, await _factory.CountCheckInsAsync(user.Id));

        var liste = await (await client.GetAsync($"/api/User/{user.Id}/checkins?von=2026-03-01&bis=2026-03-31")).ReadJsonAsync();
        Assert.Equal("Abwesend", liste[0].GetProperty("status").GetString());
    }

    [Fact]
    public async Task Put_creates_the_entry_when_none_exists_yet()
    {
        var user = await _factory.CreateUserAsync(NewEmail());
        var client = await AdminClientAsync();

        var response = await client.PutAsJsonAsync($"/api/User/{user.Id}/checkin", new { status = "Office", datum = "2026-03-05" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(1, await _factory.CountCheckInsAsync(user.Id));
    }

    [Fact]
    public async Task Check_ins_for_future_days_are_rejected()
    {
        var user = await _factory.CreateUserAsync(NewEmail());
        var client = await AdminClientAsync();
        var morgen = DateTime.UtcNow.Date.AddDays(1).ToString("yyyy-MM-dd");

        var post = await client.PostAsJsonAsync($"/api/User/{user.Id}/checkin", new { status = "Office", datum = morgen });
        var put = await client.PutAsJsonAsync($"/api/User/{user.Id}/checkin", new { status = "Office", datum = morgen });

        Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, put.StatusCode);
        Assert.Equal(0, await _factory.CountCheckInsAsync(user.Id));
    }

    [Fact]
    public async Task Todays_date_is_allowed()
    {
        var user = await _factory.CreateUserAsync(NewEmail());
        var client = await AdminClientAsync();
        var heute = DateTime.UtcNow.Date.ToString("yyyy-MM-dd");

        var response = await client.PostAsJsonAsync($"/api/User/{user.Id}/checkin", new { status = "Office", datum = heute });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task An_unknown_employee_returns_not_found()
    {
        var client = await AdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/User/gibt-es-nicht/checkin", new { status = "Office", datum = "2026-03-02" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task An_invalid_status_value_is_rejected()
    {
        var user = await _factory.CreateUserAsync(NewEmail());
        var client = await AdminClientAsync();

        var response = await client.PostAsJsonAsync($"/api/User/{user.Id}/checkin", new { status = "Urlaub", datum = "2026-03-02" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Employees_cannot_add_or_correct_check_ins_for_others()
    {
        var opfer = await _factory.CreateUserAsync(NewEmail());
        var email = NewEmail();
        await _factory.CreateUserAsync(email);
        var client = await _factory.LoginClientAsync(email);

        var post = await client.PostAsJsonAsync($"/api/User/{opfer.Id}/checkin", new { status = "Office", datum = "2026-03-02" });
        var put = await client.PutAsJsonAsync($"/api/User/{opfer.Id}/checkin", new { status = "Office", datum = "2026-03-02" });

        Assert.Equal(HttpStatusCode.Forbidden, post.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, put.StatusCode);
        Assert.Equal(0, await _factory.CountCheckInsAsync(opfer.Id));
    }

    // ---------- Listen ----------

    [Fact]
    public async Task The_employee_list_does_not_contain_admins()
    {
        var mitarbeiterEmail = NewEmail();
        await _factory.CreateUserAsync(mitarbeiterEmail);
        var adminEmail = NewEmail();
        await _factory.CreateUserAsync(adminEmail, "Admin");
        var client = await _factory.LoginClientAsync(adminEmail);

        var json = await (await client.GetAsync("/api/User/mitarbeiter")).ReadJsonAsync();

        var mails = json.EnumerateArray().Select(e => e.GetProperty("email").GetString()).ToList();
        Assert.Contains(mitarbeiterEmail, mails);
        Assert.DoesNotContain(adminEmail, mails);
    }

    [Fact]
    public async Task The_full_user_list_still_contains_admins()
    {
        var adminEmail = NewEmail();
        await _factory.CreateUserAsync(adminEmail, "Admin");
        var client = await _factory.LoginClientAsync(adminEmail);

        var json = await (await client.GetAsync("/api/User")).ReadJsonAsync();

        Assert.Contains(json.EnumerateArray(), e => e.GetProperty("email").GetString() == adminEmail);
    }

    [Fact]
    public async Task The_entries_of_an_employee_are_listed_newest_first()
    {
        var user = await _factory.CreateUserAsync(NewEmail());
        await _factory.AddCheckInAsync(user.Id, AttendanceStatus.Office, new DateTime(2026, 4, 1, 8, 0, 0));
        await _factory.AddCheckInAsync(user.Id, AttendanceStatus.HomeOffice, new DateTime(2026, 4, 3, 8, 0, 0));
        var client = await AdminClientAsync();

        var json = await (await client.GetAsync($"/api/User/{user.Id}/checkins?von=2026-04-01&bis=2026-04-30")).ReadJsonAsync();

        Assert.Equal(2, json.GetArrayLength());
        Assert.Equal("2026-04-03", json[0].GetProperty("datum").GetString());
        Assert.Equal("2026-04-01", json[1].GetProperty("datum").GetString());
    }

    [Fact]
    public async Task The_entry_list_rejects_an_end_date_before_the_start_date()
    {
        var user = await _factory.CreateUserAsync(NewEmail());
        var client = await AdminClientAsync();

        var response = await client.GetAsync($"/api/User/{user.Id}/checkins?von=2026-04-30&bis=2026-04-01");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
