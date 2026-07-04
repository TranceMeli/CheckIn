using backend.Dto;

namespace backend.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginDto dto);
        Task<bool> SetPasswordAsync(SetPasswordDto dto);

        // Gibt neuen Access Token zurück wenn Refresh Token gültig ist
        Task<AuthResponseDto?> RefreshAsync(string refreshToken);

        // Revoked den Refresh Token in der DB
        Task<bool> LogoutAsync(string refreshToken);
    }
}