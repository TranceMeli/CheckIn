using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _service;

        public DashboardController(IDashboardService service)
        {
            _service = service;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> Overview(
            [FromQuery] DateTime von, [FromQuery] DateTime bis,
            [FromQuery] string? abteilung, [FromQuery] string? userId)
        {
            if (bis < von) return BadRequest("Ungültiger Zeitraum");
            return Ok(await _service.GetOverviewAsync(von, bis, abteilung, userId));
        }

        [HttpGet("verlauf")]
        public async Task<IActionResult> Verlauf(
            [FromQuery] int jahr, [FromQuery] string? abteilung, [FromQuery] string? userId)
            => Ok(await _service.GetVerlaufAsync(jahr, abteilung, userId));

        [HttpGet("heatmap")]
        public async Task<IActionResult> Heatmap(
            [FromQuery] int jahr, [FromQuery] string? abteilung, [FromQuery] string? userId)
            => Ok(await _service.GetHeatmapAsync(jahr, abteilung, userId));

        [HttpGet("team-woche")]
        public async Task<IActionResult> TeamWoche([FromQuery] DateTime montag, [FromQuery] string? abteilung)
            => Ok(await _service.GetTeamWocheAsync(montag, abteilung));
    }
}
