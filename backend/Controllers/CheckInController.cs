using System.Security.Claims;
using backend.Dto;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Mitarbeiter")]
    public class CheckInController : ControllerBase
    {
        private readonly ICheckInService _checkInService;
        private readonly IDashboardService _dashboardService;

        public CheckInController(ICheckInService checkInService, IDashboardService dashboardService)
        {
            _checkInService = checkInService;
            _dashboardService = dashboardService;
        }

        [HttpPost("set-status")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var checkIn = await _checkInService.CheckInAsync(userId!, dto.Status);
            return Ok(checkIn);
        }

        [HttpGet("checkin")]
        public async Task<IActionResult> GetCurrentCheckIn()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var status = await _checkInService.GetCurrentCheckInAsync(userId!);

            if (status == null)
                return NotFound("Heute noch nicht eingecheckt");

            return Ok(status);
        }

        [HttpGet("stats/me")]
        public async Task<IActionResult> GetMyStats(
            [FromQuery] int? monat,
            [FromQuery] int? jahr)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var stats = await _checkInService.GetMyStatsAsync(userId, monat, jahr);
            return Ok(stats);
        }

        // Eigene Auswertung: gleiche Berechnung wie im Admin-Dashboard, aber immer nur für den angemeldeten Nutzer
        [HttpGet("dashboard/overview")]
        public async Task<IActionResult> MyOverview([FromQuery] DateTime von, [FromQuery] DateTime bis)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();
            if (bis < von) return BadRequest("Ungültiger Zeitraum");

            var overview = await _dashboardService.GetOverviewAsync(von, bis, null, userId);
            // Abteilungsvergleich und Rangliste enthalten Daten anderer Personen und gehören nur ins Admin-Dashboard
            overview.Abteilungen = new();
            overview.Ranking = new();
            return Ok(overview);
        }

        [HttpGet("dashboard/verlauf")]
        public async Task<IActionResult> MyVerlauf([FromQuery] int jahr)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();
            return Ok(await _dashboardService.GetVerlaufAsync(jahr, null, userId));
        }

        [HttpGet("dashboard/heatmap")]
        public async Task<IActionResult> MyHeatmap([FromQuery] int jahr)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();
            return Ok(await _dashboardService.GetHeatmapAsync(jahr, null, userId));
        }
    }
}
