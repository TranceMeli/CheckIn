using System.Net;
using System.Net.Http.Json;
using backend.Tests.Support;

namespace backend.Tests.Integration;

public class AuthApiTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public AuthApiTests(ApiFactory factory) => _factory = factory;

    private static string NewEmail() => $"{Guid.NewGuid():N}@test.de";

    // Liest den Wert des refreshToken-Cookies aus dem Set-Cookie-Header
    private static string? RefreshCookie(HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var cookies)) return null;
        return cookies.FirstOrDefault(c => c.StartsWith("refreshToken=", StringComparison.Ordinal));
    }

    private static string CookieValue(string setCookie) => setCookie.Split(';')[0];

    [Fact]
    public async Task Login_with_valid_credentials_returns_a_token_and_the_roles()
    {
        var email = NewEmail();
        await _factory.CreateUserAsync(email, "Admin");
        var client = _factory.CreateApiClient();

        var response = await client.PostAsJsonAsync("/api/Auth/login", new { email, password = ApiFactory.Password });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.ReadJsonAsync();
        Assert.False(string.IsNullOrWhiteSpace(json.GetProperty("accessToken").GetString()));
        Assert.Equal(email, json.GetProperty("email").GetString());
        Assert.Equal("Admin", json.GetProperty("roles")[0].GetString());
    }

    [Fact]
    public async Task Login_sets_the_refresh_token_as_an_http_only_secure_cookie()
    {
        var email = NewEmail();
        await _factory.CreateUserAsync(email);
        var client = _factory.CreateApiClient();

        var response = await client.PostAsJsonAsync("/api/Auth/login", new { email, password = ApiFactory.Password });

        var cookie = RefreshCookie(response);
        Assert.NotNull(cookie);
        Assert.Contains("httponly", cookie!, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("secure", cookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_does_not_return_the_refresh_token_in_the_body()
    {
        var email = NewEmail();
        await _factory.CreateUserAsync(email);
        var client = _factory.CreateApiClient();

        var response = await client.PostAsJsonAsync("/api/Auth/login", new { email, password = ApiFactory.Password });

        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("refreshToken", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_with_a_wrong_password_is_rejected()
    {
        var email = NewEmail();
        await _factory.CreateUserAsync(email);
        var client = _factory.CreateApiClient();

        var response = await client.PostAsJsonAsync("/api/Auth/login", new { email, password = "Falsch123!" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Null(RefreshCookie(response));
    }

    [Fact]
    public async Task Login_with_an_unknown_email_is_rejected()
    {
        var client = _factory.CreateApiClient();

        var response = await client.PostAsJsonAsync("/api/Auth/login", new { email = NewEmail(), password = ApiFactory.Password });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_with_an_invalid_body_is_rejected_by_validation()
    {
        var client = _factory.CreateApiClient();

        var response = await client.PostAsJsonAsync("/api/Auth/login", new { email = "keine-mail", password = "kurz" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_without_a_cookie_is_unauthorized()
    {
        var client = _factory.CreateApiClient();

        var response = await client.PostAsync("/api/Auth/refresh", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_issues_a_new_token_and_rotates_the_refresh_cookie()
    {
        var email = NewEmail();
        await _factory.CreateUserAsync(email);
        var client = _factory.CreateApiClient();

        var login = await client.PostAsJsonAsync("/api/Auth/login", new { email, password = ApiFactory.Password });
        var alt = CookieValue(RefreshCookie(login)!);

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/Auth/refresh");
        request.Headers.Add("Cookie", alt);
        var refreshed = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, refreshed.StatusCode);
        var neu = CookieValue(RefreshCookie(refreshed)!);
        Assert.NotEqual(alt, neu);
        Assert.False(string.IsNullOrWhiteSpace((await refreshed.ReadJsonAsync()).GetProperty("accessToken").GetString()));
    }

    [Fact]
    public async Task A_rotated_refresh_token_cannot_be_used_again()
    {
        var email = NewEmail();
        await _factory.CreateUserAsync(email);
        var client = _factory.CreateApiClient();
        var login = await client.PostAsJsonAsync("/api/Auth/login", new { email, password = ApiFactory.Password });
        var alt = CookieValue(RefreshCookie(login)!);

        var first = new HttpRequestMessage(HttpMethod.Post, "/api/Auth/refresh");
        first.Headers.Add("Cookie", alt);
        await client.SendAsync(first);

        var again = new HttpRequestMessage(HttpMethod.Post, "/api/Auth/refresh");
        again.Headers.Add("Cookie", alt);
        var response = await client.SendAsync(again);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_revokes_the_refresh_token()
    {
        var email = NewEmail();
        await _factory.CreateUserAsync(email);
        var client = _factory.CreateApiClient();
        var login = await client.PostAsJsonAsync("/api/Auth/login", new { email, password = ApiFactory.Password });
        var cookie = CookieValue(RefreshCookie(login)!);

        var logout = new HttpRequestMessage(HttpMethod.Post, "/api/Auth/logout");
        logout.Headers.Add("Cookie", cookie);
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(logout)).StatusCode);

        var refresh = new HttpRequestMessage(HttpMethod.Post, "/api/Auth/refresh");
        refresh.Headers.Add("Cookie", cookie);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.SendAsync(refresh)).StatusCode);
    }

    [Fact]
    public async Task A_new_login_revokes_the_previous_refresh_token()
    {
        var email = NewEmail();
        await _factory.CreateUserAsync(email);
        var client = _factory.CreateApiClient();
        var first = await client.PostAsJsonAsync("/api/Auth/login", new { email, password = ApiFactory.Password });
        var erstesCookie = CookieValue(RefreshCookie(first)!);

        await client.PostAsJsonAsync("/api/Auth/login", new { email, password = ApiFactory.Password });

        var refresh = new HttpRequestMessage(HttpMethod.Post, "/api/Auth/refresh");
        refresh.Headers.Add("Cookie", erstesCookie);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.SendAsync(refresh)).StatusCode);
    }

    [Theory]
    [InlineData("/api/User/mitarbeiter")]
    [InlineData("/api/Dashboard/heatmap?jahr=2026")]
    [InlineData("/api/CheckIn/checkin")]
    [InlineData("/api/CheckIn/dashboard/verlauf?jahr=2026")]
    public async Task Protected_endpoints_require_a_token(string url)
    {
        var client = _factory.CreateApiClient();

        var response = await client.GetAsync(url);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_forged_token_is_rejected()
    {
        var client = _factory.CreateApiClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "das.ist.kein.token");

        var response = await client.GetAsync("/api/User/mitarbeiter");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
