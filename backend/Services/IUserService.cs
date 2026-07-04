using backend.Dto;
using backend.Models;

namespace backend.Services
{
    public interface IUserService
    {
        Task<List<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetUserByIdAsync(string id);
        Task<List<UserDto>> GetMitarbeiterAsync();
        Task<CheckInStatsDto> GetStatsAsync(
            string? abteilung,
            string? userId,
            int? monat,
            int? jahr);
        Task<List<AbteilungStatsDto>> GetAbteilungStatsAsync(int? monat, int? jahr);
        Task<CheckInStatusDto?> AdminCheckInAsync(string userId, AttendanceStatus status);
        Task<List<CheckInExportDto>> GetExportAsync(string? abteilung, string? userId, int? monat, int? jahr);
    }
}