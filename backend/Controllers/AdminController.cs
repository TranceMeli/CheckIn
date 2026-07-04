using backend.Dto;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {

        private readonly IInvitationService _invitationService;
        private readonly ICheckInService _teilnehmerService;

        public AdminController(IInvitationService invitationService, ICheckInService teilnehmerService)
        {
            _invitationService = invitationService;
            _teilnehmerService = teilnehmerService;
        }


        [HttpPost("invite")]
        public async Task<IActionResult> InviteUser(InviteUserDto dto)
        {
            await _invitationService.SendInvitationAsync(dto);
            return Ok("Einladung verschickt");
        }
    }
}
