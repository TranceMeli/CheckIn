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

        public CheckInController(ICheckInService checkInService)
        {
            _checkInService = checkInService;
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
    }
}