using backend.Dto;
using Microsoft.AspNetCore.Mvc;
using backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        private const string RefreshTokenCookie = "refreshToken";

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            if (result == null)
                return BadRequest("Ungültige Anmeldedaten");

            SetRefreshTokenCookie(result.RefreshToken);

            return Ok(new
            {
                accessToken = result.AccessToken,
                result.Email,
                result.Username,
                result.Roles
            });
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh()
        {
            var refreshToken = Request.Cookies[RefreshTokenCookie];
            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized("Kein Refresh Token");

            var result = await _authService.RefreshAsync(refreshToken);
            if (result == null)
                return Unauthorized("Ungültiger oder abgelaufener Refresh Token");

            SetRefreshTokenCookie(result.RefreshToken);

            return Ok(new
            {
                accessToken = result.AccessToken,
                result.Email,
                result.Username,
                result.Roles
            });
        }

        [HttpPost("logout")]
        [AllowAnonymous]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies[RefreshTokenCookie];

            if (!string.IsNullOrEmpty(refreshToken))
                await _authService.LogoutAsync(refreshToken);

            Response.Cookies.Delete(RefreshTokenCookie);
            return Ok("Abgemeldet");
        }

        [HttpPost("set-password")]
        [AllowAnonymous]
        public async Task<IActionResult> SetPassword(SetPasswordDto dto)
        {
            var success = await _authService.SetPasswordAsync(dto);
            if (!success)
                return BadRequest("Ungültiger oder abgelaufener Token");
            return Ok("Passwort erfolgreich gesetzt");
        }

        private void SetRefreshTokenCookie(string token)
        {
            var options = new CookieOptions
            {
                HttpOnly = true,        
                Secure = true,          
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            Response.Cookies.Append(RefreshTokenCookie, token, options);
        }
    }
}