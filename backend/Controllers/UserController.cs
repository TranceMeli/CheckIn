using backend.Dto;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            return Ok(user);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats(
            [FromQuery] string? abteilung,
            [FromQuery] string? userId,
            [FromQuery] int? monat,
            [FromQuery] int? jahr)
        {
            var stats = await _userService.GetStatsAsync(abteilung, userId, monat, jahr);
            return Ok(stats);
        }

        [HttpGet("stats/abteilungen")]
        public async Task<IActionResult> GetAbteilungStats(
            [FromQuery] int? monat,
            [FromQuery] int? jahr)
        {
            var stats = await _userService.GetAbteilungStatsAsync(monat, jahr);
            return Ok(stats);
        }

        [HttpGet("mitarbeiter")]
        public async Task<IActionResult> GetMitarbeiter()
        {
            var mitarbeiter = await _userService.GetMitarbeiterAsync();
            return Ok(mitarbeiter.OrderBy(m => m.Abteilung).ThenBy(m => m.LastName));
        }

        [HttpGet("{userId}/checkins")]
        public async Task<IActionResult> GetCheckIns(string userId, [FromQuery] DateTime von, [FromQuery] DateTime bis)
        {
            if (bis < von) return BadRequest("Ungültiger Zeitraum");
            return Ok(await _userService.GetCheckInsAsync(userId, von, bis));
        }

        // Nachtragen: legt einen Check-in für einen vergangenen Tag an; existiert schon einer, antwortet 409
        [HttpPost("{userId}/checkin")]
        public async Task<IActionResult> AdminCheckIn(string userId, [FromBody] AdminCheckInDto dto)
            => await SetCheckIn(userId, dto, overwrite: false);

        // Korrigieren: ersetzt einen bestehenden Check-in
        [HttpPut("{userId}/checkin")]
        public async Task<IActionResult> AdminCorrectCheckIn(string userId, [FromBody] AdminCheckInDto dto)
            => await SetCheckIn(userId, dto, overwrite: true);

        private async Task<IActionResult> SetCheckIn(string userId, AdminCheckInDto dto, bool overwrite)
        {
            if (dto.Datum?.Date > DateTime.UtcNow.Date)
                return BadRequest("Check-ins können nicht für die Zukunft nachgetragen werden");

            var result = await _userService.AdminSetCheckInAsync(userId, dto.Datum, dto.Status, overwrite);
            if (result == null) return NotFound("Mitarbeiter nicht gefunden");
            if (!result.Gespeichert) return Conflict(result);
            return Ok(result);
        }

        [HttpGet("export")]
        public async Task<IActionResult> GetExport(
            [FromQuery] string? abteilung,
            [FromQuery] string? userId,
            [FromQuery] int? monat,
            [FromQuery] int? jahr)
        {
            var data = await _userService.GetExportAsync(abteilung, userId, monat, jahr);
            return Ok(data);
        }
    }
}