using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace backend.Tests.Support;

/// <summary>
/// Startet die komplette API im Speicher (echte Controller, Authentifizierung und Rollen),
/// aber mit einer In-Memory-Datenbank statt SQL Server. Im Environment "Testing" wird nichts geseedet.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    public const string Password = "Passwort123!";

    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Jwt:Key", "test-key-test-key-test-key-test-key-0123456789");
        builder.UseSetting("Jwt:Issuer", "checkin-tests");
        builder.UseSetting("Jwt:Audience", "checkin-tests");
        builder.UseSetting("Jwt:ExpiresInMinutes", "15");
        builder.UseSetting("ConnectionStrings:DefaultConnection", "wird-in-den-tests-nicht-benutzt");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();

            // Ab EF Core 9 merkt sich AddDbContext die UseSqlServer-Konfiguration zusätzlich als
            // IDbContextOptionsConfiguration<AppDbContext>. Sie muss ebenfalls weg, sonst sind zwei Provider aktiv.
            foreach (var descriptor in services.Where(d =>
                         d.ServiceType.IsGenericType
                         && d.ServiceType.GetGenericTypeDefinition().Name.StartsWith("IDbContextOptionsConfiguration")
                         && d.ServiceType.GenericTypeArguments[0] == typeof(AppDbContext)).ToList())
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_dbName));
        });
    }

    public HttpClient CreateApiClient() =>
        CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false, AllowAutoRedirect = false });

    public async Task<User> CreateUserAsync(
        string email, string role = "Mitarbeiter", string firstName = "Test", string lastName = "Person",
        string abteilung = "Testabteilung")
    {
        using var scope = Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        if (!await roles.RoleExistsAsync(role))
            await roles.CreateAsync(new IdentityRole(role));

        var user = new User
        {
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Abteilung = abteilung,
        };

        var result = await users.CreateAsync(user, Password);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));

        await users.AddToRoleAsync(user, role);
        return user;
    }

    public async Task AddCheckInAsync(string userId, AttendanceStatus status, DateTime zeitpunkt)
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        context.CheckIns.Add(new CheckIn { UserId = userId, Status = status, Timestamp = zeitpunkt });
        await context.SaveChangesAsync();
    }

    public async Task<int> CountCheckInsAsync(string userId)
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await context.CheckIns.CountAsync(c => c.UserId == userId);
    }

    /// <summary>Meldet den Benutzer über den echten Login-Endpunkt an und liefert einen Client mit Bearer-Token.</summary>
    public async Task<HttpClient> LoginClientAsync(string email)
    {
        var client = CreateApiClient();
        var response = await client.PostAsJsonAsync("/api/Auth/login", new { email, password = Password });
        response.EnsureSuccessStatusCode();

        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var token = json.RootElement.GetProperty("accessToken").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}

public static class HttpExtensions
{
    public static async Task<JsonElement> ReadJsonAsync(this HttpResponseMessage response)
    {
        var text = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(text);
        return doc.RootElement.Clone();
    }
}
