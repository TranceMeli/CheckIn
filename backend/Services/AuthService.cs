using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Dto;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly JwtSettings _jwtSettings;
        private readonly AppDbContext _context;

        public AuthService(
            UserManager<User> userManager,
            IOptions<JwtSettings> jwtOptions,
            AppDbContext context)
        {
            _userManager = userManager;
            _jwtSettings = jwtOptions.Value;
            _context = context;
        }

        public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null) return null;

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!isPasswordValid) return null;

            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = GenerateAccessToken(user, roles);

            // Alten Refresh Token des Users revoken (nur ein aktiver Token pro User)
            var existing = await _context.RefreshTokens
                .Where(r => r.UserId == user.Id && !r.IsRevoked)
                .ToListAsync();
            existing.ForEach(r => r.IsRevoked = true);

            var refreshToken = await CreateRefreshTokenAsync(user.Id);
            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                Email = user.Email!,
                Username = user.UserName!,
                Roles = roles.ToList(),
                RefreshToken = refreshToken.Token
            };
        }

        public async Task<AuthResponseDto?> RefreshAsync(string refreshToken)
        {
            var stored = await _context.RefreshTokens
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Token == refreshToken && !r.IsRevoked);

            if (stored == null || stored.ExpiresAt < DateTime.UtcNow)
                return null;

            // Rotation: alten Token revoken, neuen ausstellen
            stored.IsRevoked = true;

            var roles = await _userManager.GetRolesAsync(stored.User);
            var newAccessToken = GenerateAccessToken(stored.User, roles);
            var newRefreshToken = await CreateRefreshTokenAsync(stored.UserId);

            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = newAccessToken,
                Email = stored.User.Email!,
                Username = stored.User.UserName!,
                Roles = roles.ToList(),
                RefreshToken = newRefreshToken.Token
            };
        }

        public async Task<bool> LogoutAsync(string refreshToken)
        {
            var stored = await _context.RefreshTokens
                .FirstOrDefaultAsync(r => r.Token == refreshToken && !r.IsRevoked);

            if (stored == null) return false;

            stored.IsRevoked = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetPasswordAsync(SetPasswordDto dto)
        {
            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null) return false;

            var decodedToken = Encoding.UTF8.GetString(
                WebEncoders.Base64UrlDecode(dto.Token));

            var result = await _userManager.ResetPasswordAsync(user, decodedToken, dto.NewPassword);
            return result.Succeeded;
        }

        private string GenerateAccessToken(User user, IList<string> roles)
        {
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new(JwtRegisteredClaimNames.Email, user.Email!),
                new("username", user.UserName!),
                new(ClaimTypes.NameIdentifier, user.Id)
            };

            claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiresInMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<RefreshToken> CreateRefreshTokenAsync(string userId)
        {
            var token = new RefreshToken
            {
                Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
                UserId = userId,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow,
                IsRevoked = false
            };

            _context.RefreshTokens.Add(token);
            return token;
        }
    }
}