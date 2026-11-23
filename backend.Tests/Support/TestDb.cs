using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Tests.Support;

/// <summary>
/// Frische In-Memory-Datenbank samt echtem UserManager/RoleManager für Service-Tests.
/// Jede Instanz hat ihre eigene Datenbank, Tests beeinflussen sich also nicht.
/// </summary>
public sealed class TestDb : IDisposable
{
    private readonly ServiceProvider _provider;

    public AppDbContext Context { get; }
    public UserManager<User> Users { get; }
    public RoleManager<IdentityRole> Roles { get; }

    public TestDb()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDataProtection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(Guid.NewGuid().ToString()));
        services.AddIdentity<User, IdentityRole>(o => o.User.RequireUniqueEmail = true)
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        _provider = services.BuildServiceProvider();
        Context = _provider.GetRequiredService<AppDbContext>();
        Users = _provider.GetRequiredService<UserManager<User>>();
        Roles = _provider.GetRequiredService<RoleManager<IdentityRole>>();
    }

    public async Task<User> AddUserAsync(
        string email, string firstName, string lastName, string abteilung, string role = "Mitarbeiter")
    {
        if (!await Roles.RoleExistsAsync(role))
            await Roles.CreateAsync(new IdentityRole(role));

        var user = new User
        {
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Abteilung = abteilung,
        };

        var result = await Users.CreateAsync(user);
        Assert.True(result.Succeeded, string.Join(", ", result.Errors.Select(e => e.Description)));
        await Users.AddToRoleAsync(user, role);
        return user;
    }

    public async Task<CheckIn> AddCheckInAsync(User user, AttendanceStatus status, DateTime zeitpunkt)
    {
        var checkIn = new CheckIn { UserId = user.Id, Status = status, Timestamp = zeitpunkt };
        Context.CheckIns.Add(checkIn);
        await Context.SaveChangesAsync();
        return checkIn;
    }

    public void Dispose() => _provider.Dispose();
}
