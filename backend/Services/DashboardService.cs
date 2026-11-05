using System.Globalization;
using backend.Data;
using backend.Dto;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class DashboardService : IDashboardService
    {
        private static readonly string[] Wochentage = { "Mo", "Di", "Mi", "Do", "Fr" };
        private static readonly string[] Monate =
            { "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez" };

        private readonly AppDbContext _context;
        private readonly UserManager<User> _userManager;

        public DashboardService(AppDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // Zeitraum als halboffenes Intervall [von, bis + 1 Tag): nutzt Indizes, anders als Month/Year-Vergleiche
        private IQueryable<CheckIn> Query(DateTime von, DateTime bis, string? abteilung, string? userId)
        {
            var start = von.Date;
            var ende = bis.Date.AddDays(1);
            var query = _context.CheckIns.Where(c => c.Timestamp >= start && c.Timestamp < ende);

            if (!string.IsNullOrEmpty(userId))
                query = query.Where(c => c.UserId == userId);
            if (!string.IsNullOrEmpty(abteilung))
                query = query.Where(c => c.User.Abteilung == abteilung);

            return query;
        }

        private static T Count<T>(IEnumerable<AttendanceStatus> stati) where T : StatusCountsDto, new()
        {
            var dto = new T();
            foreach (var s in stati)
            {
                switch (s)
                {
                    case AttendanceStatus.Office: dto.Office++; break;
                    case AttendanceStatus.HomeOffice: dto.HomeOffice++; break;
                    default: dto.Abwesend++; break;
                }
            }
            return dto;
        }

        public async Task<DashboardOverviewDto> GetOverviewAsync(DateTime von, DateTime bis, string? abteilung, string? userId)
        {
            var eintraege = await Query(von, bis, abteilung, userId)
                .Select(c => new { c.UserId, c.Timestamp, c.Status, c.User.FirstName, c.User.LastName, c.User.Abteilung })
                .ToListAsync();

            var wochentage = Wochentage
                .Select((label, i) =>
                {
                    var dto = Count<LabelCountsDto>(eintraege
                        .Where(e => ((int)e.Timestamp.DayOfWeek + 6) % 7 == i)
                        .Select(e => e.Status));
                    dto.Label = label;
                    return dto;
                })
                .ToList();

            // Der Abteilungsvergleich ignoriert die Abteilungs- und Mitarbeiterfilter, damit alle Abteilungen sichtbar bleiben
            var alle = await Query(von, bis, null, null)
                .Select(c => new { c.Status, c.User.Abteilung })
                .ToListAsync();

            var abteilungen = alle
                .Where(e => !string.IsNullOrEmpty(e.Abteilung))
                .GroupBy(e => e.Abteilung)
                .OrderBy(g => g.Key)
                .Select(g =>
                {
                    var dto = Count<LabelCountsDto>(g.Select(e => e.Status));
                    dto.Label = g.Key;
                    return dto;
                })
                .ToList();

            var ranking = eintraege
                .Where(e => e.Status == AttendanceStatus.Office)
                .GroupBy(e => new { e.UserId, e.FirstName, e.LastName, e.Abteilung })
                .Select(g => new RankingEntryDto
                {
                    UserId = g.Key.UserId,
                    Name = $"{g.Key.FirstName} {g.Key.LastName}",
                    Abteilung = g.Key.Abteilung,
                    Office = g.Count(),
                })
                .OrderByDescending(r => r.Office)
                .ThenBy(r => r.Name)
                .Take(5)
                .ToList();

            return new DashboardOverviewDto
            {
                Gesamt = Count<StatusCountsDto>(eintraege.Select(e => e.Status)),
                Wochentage = wochentage,
                Abteilungen = abteilungen,
                Ranking = ranking,
            };
        }

        public async Task<List<LabelCountsDto>> GetVerlaufAsync(int jahr, string? abteilung, string? userId)
        {
            var eintraege = await Query(new DateTime(jahr, 1, 1), new DateTime(jahr, 12, 31), abteilung, userId)
                .Select(c => new { c.Timestamp, c.Status })
                .ToListAsync();

            return Enumerable.Range(1, 12)
                .Select(m =>
                {
                    var dto = Count<LabelCountsDto>(eintraege.Where(e => e.Timestamp.Month == m).Select(e => e.Status));
                    dto.Label = Monate[m - 1];
                    return dto;
                })
                .ToList();
        }

        public async Task<List<HeatmapWocheDto>> GetHeatmapAsync(int jahr, string? abteilung, string? userId)
        {
            var eintraege = await Query(new DateTime(jahr, 1, 1), new DateTime(jahr, 12, 31), abteilung, userId)
                .Select(c => new { c.Timestamp, c.Status })
                .ToListAsync();

            var proWoche = eintraege
                .GroupBy(e => ISOWeek.GetWeekOfYear(e.Timestamp))
                .ToDictionary(g => g.Key, g => (Total: g.Count(), Office: g.Count(e => e.Status == AttendanceStatus.Office)));

            return Enumerable.Range(1, 52)
                .Select(w => new HeatmapWocheDto
                {
                    Woche = w,
                    Total = proWoche.TryGetValue(w, out var v) ? v.Total : 0,
                    Office = proWoche.TryGetValue(w, out var v2) ? v2.Office : 0,
                })
                .ToList();
        }

        public async Task<List<TeamWocheEintragDto>> GetTeamWocheAsync(DateTime montag, string? abteilung)
        {
            var start = montag.Date;
            var ende = start.AddDays(5);

            var mitarbeiter = (await _userManager.GetUsersInRoleAsync("Mitarbeiter"))
                .Where(u => string.IsNullOrEmpty(abteilung) || u.Abteilung == abteilung)
                .OrderBy(u => u.Abteilung).ThenBy(u => u.LastName)
                .ToList();

            var ids = mitarbeiter.Select(u => u.Id).ToList();
            var eintraege = await _context.CheckIns
                .Where(c => c.Timestamp >= start && c.Timestamp < ende && ids.Contains(c.UserId))
                .Select(c => new { c.UserId, c.Timestamp, c.Status })
                .ToListAsync();

            return mitarbeiter.Select(u =>
            {
                var eintrag = new TeamWocheEintragDto
                {
                    UserId = u.Id,
                    Name = $"{u.FirstName} {u.LastName}",
                    Abteilung = u.Abteilung,
                };
                foreach (var e in eintraege.Where(e => e.UserId == u.Id))
                {
                    var tag = (int)(e.Timestamp.Date - start).TotalDays;
                    if (tag is >= 0 and < 5) eintrag.Tage[tag] = e.Status.ToString();
                }
                return eintrag;
            }).ToList();
        }
    }
}
