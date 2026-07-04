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

        [HttpPost("{userId}/checkin")]
        public async Task<IActionResult> AdminCheckIn(string userId, [FromBody] CheckInDto dto)
        {
            var result = await _userService.AdminCheckInAsync(userId, dto.Status);
            if (result == null) return NotFound("Mitarbeiter nicht gefunden");
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