using backend.Data;
using backend.Dto;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class CheckInService : ICheckInService
    {

        private readonly AppDbContext _context;
        private readonly UserManager<User> _userManager;

        public CheckInService(AppDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }
        // aktuellen status einchecken
        public async Task<CheckInStatusDto> CheckInAsync(string identifier, AttendanceStatus status)
        {

            // status setzen
            // user finden über email oder id

            var user = await _userManager.FindByIdAsync(identifier)
                ?? await _userManager.FindByEmailAsync(identifier);

            if (user == null)
            {
                throw new Exception("User existiert nicht!");
            }
            var today = DateTime.UtcNow.Date;

            var existing = await _context.CheckIns
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.UserId == user.Id && c.Timestamp.Date == today);


            if (existing != null)

                return new CheckInStatusDto
                {
                    AlreadyCheckedIn = true,
                    UserId = existing.UserId,
                    FirstName = existing.User.FirstName,
                    LastName = existing.User.LastName,
                    Status = existing.Status,
                    Timestamp = existing.Timestamp,
                };


            var checkIn = new CheckIn
            {
                UserId = user.Id,
                Timestamp = DateTime.UtcNow,
                Status = status
            };

            _context.CheckIns.Add(checkIn);
            await _context.SaveChangesAsync();


            return new CheckInStatusDto
            {
                AlreadyCheckedIn = false,
                UserId = user!.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Status = checkIn.Status,
                Timestamp = checkIn.Timestamp,
            };
        }

        // den letzten eintrag abfragen

        public async Task<CheckInStatusDto?> GetCurrentCheckInAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId)
        ?? await _userManager.FindByEmailAsync(userId);

            if (user == null) return null;

            var lastCheckIn = await _context.CheckIns
                .Include(c => c.User)
                .Where(c => c.UserId == user.Id)
                .OrderByDescending(c => c.Timestamp)
                .FirstOrDefaultAsync();

            if (lastCheckIn == null) return null;

            return new CheckInStatusDto
            {
                AlreadyCheckedIn = lastCheckIn.Timestamp.Date == DateTime.UtcNow.Date,
                UserId = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Status = lastCheckIn.Status,
                Timestamp = lastCheckIn.Timestamp,
            };
        }


        public async Task<CheckInStatsDto> GetMyStatsAsync(string userId, int? monat, int? jahr)

        {
            var query = _context.CheckIns
                .Include (c => c.User)
                .Where(c => c.UserId == userId)
                .AsQueryable();

            if (monat.HasValue && jahr.HasValue)
                query = query.Where(c => c.Timestamp.Month == monat.Value && c.Timestamp.Year == jahr.Value);
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
    }
}
