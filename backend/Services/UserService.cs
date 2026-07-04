using backend.Data;
using backend.Dto;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;
        private readonly AppDbContext _context;

        public UserService(UserManager<User> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            return _userManager.Users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email ?? string.Empty,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Abteilung = u.Abteilung,
            }).ToList();
        }

        public async Task<UserDto?> GetUserByIdAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Abteilung = user.Abteilung,
            };
        }

        public async Task<List<UserDto>> GetMitarbeiterAsync()
        {
            var mitarbeiter = await _userManager.GetUsersInRoleAsync("Mitarbeiter");
            return mitarbeiter.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email ?? string.Empty,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Abteilung = u.Abteilung,
            }).ToList();
        }

        public async Task<CheckInStatsDto> GetStatsAsync(
            string? abteilung,
            string? userId,
            int? monat,
            int? jahr)
        {
            var query = _context.CheckIns
                .Include(c => c.User)
                .AsQueryable();

            if (!string.IsNullOrEmpty(userId))
                query = query.Where(c => c.UserId == userId);

            if (!string.IsNullOrEmpty(abteilung))
                query = query.Where(c => c.User.Abteilung == abteilung);

            if (monat.HasValue && jahr.HasValue)
                query = query.Where(c => c.Timestamp.Month == monat && c.Timestamp.Year == jahr);
            else if (jahr.HasValue)
                query = query.Where(c => c.Timestamp.Year == jahr.Value);

            var checkIns = await query.ToListAsync();

            return new CheckInStatsDto
            {
                Total = checkIns.Count,
                HomeOfficeCount = checkIns.Count(c => c.Status == AttendanceStatus.HomeOffice),
                OfficeCount = checkIns.Count(c => c.Status == AttendanceStatus.Office),
                AbwesendCount = checkIns.Count(c => c.Status == AttendanceStatus.Abwesend),
                Monthly = checkIns
                    .GroupBy(c => c.Timestamp.Date)
                    .OrderBy(g => g.Key)
                    .Select(g => new DailyEntryDto
                    {
                        Date = g.Key.ToString("dd.MM"),
                        HomeOffice = g.Count(c => c.Status == AttendanceStatus.HomeOffice),
                        Office = g.Count(c => c.Status == AttendanceStatus.Office),
                        Abwesend = g.Count(c => c.Status == AttendanceStatus.Abwesend),
                    })
                    .ToList()
            };
        }

        public async Task<List<AbteilungStatsDto>> GetAbteilungStatsAsync(int? monat, int? jahr)
        {
            var query = _context.CheckIns
                .Include(c => c.User)
                .AsQueryable();

            if (monat.HasValue && jahr.HasValue)
                query = query.Where(c => c.Timestamp.Month == monat.Value && c.Timestamp.Year == jahr.Value);
            else if (jahr.HasValue)
                query = query.Where(c => c.Timestamp.Year == jahr.Value);

            var checkIns = await query.ToListAsync();

            return checkIns
                .GroupBy(c => c.User.Abteilung)
                .OrderBy(g => g.Key)
                .Select(g => new AbteilungStatsDto
                {
                    Abteilung = g.Key,
                    HomeOffice = g.Count(c => c.Status == AttendanceStatus.HomeOffice),
                    Office = g.Count(c => c.Status == AttendanceStatus.Office),
                    Abwesend = g.Count(c => c.Status == AttendanceStatus.Abwesend),
                })
                .ToList();
        }

        public async Task<CheckInStatusDto?> AdminCheckInAsync(string userId, AttendanceStatus status)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return null;

            var today = DateTime.UtcNow.Date;

            var existing = await _context.CheckIns
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Timestamp.Date == today);

            if (existing != null)
            {
                return new CheckInStatusDto
                {
                    AlreadyCheckedIn = true,
                    UserId = existing.UserId,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Status = existing.Status,
                    Timestamp = existing.Timestamp,
                };
            }

            var checkIn = new CheckIn
            {
                UserId = userId,
                Timestamp = DateTime.UtcNow,
                Status = status,
            };

            _context.CheckIns.Add(checkIn);
            await _context.SaveChangesAsync();

            return new CheckInStatusDto
            {
                AlreadyCheckedIn = false,
                UserId = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Status = checkIn.Status,
                Timestamp = checkIn.Timestamp,
            };
        }

        public async Task<List<CheckInExportDto>> GetExportAsync(
            string? abteilung, string? userId, int? monat, int? jahr)
        {
            var query = _context.CheckIns
                .Include(c => c.User)
                .AsQueryable();

            if (!string.IsNullOrEmpty(userId))
                query = query.Where(c => c.UserId == userId);
            if (!string.IsNullOrEmpty(abteilung))
                query = query.Where(c => c.User.Abteilung == abteilung);
            if (monat.HasValue && jahr.HasValue)
                query = query.Where(c => c.Timestamp.Month == monat && c.Timestamp.Year == jahr);
            else if (jahr.HasValue)
                query = query.Where(c => c.Timestamp.Year == jahr.Value);

            var checkIns = await query.OrderBy(c => c.Timestamp).ToListAsync();

            return checkIns.Select(c => new CheckInExportDto
            {
                Datum = c.Timestamp.ToString("dd.MM.yyyy"),
                Vorname = c.User.FirstName,
                Nachname = c.User.LastName,
                Status = c.Status.ToString(),
                Abteilung = c.User.Abteilung,
            }).ToList();
        }
    }
}