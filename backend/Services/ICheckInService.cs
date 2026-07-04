using backend.Dto;
using backend.Models;

namespace backend.Services
{
    public interface ICheckInService
    {
        Task<CheckInStatusDto?> GetCurrentCheckInAsync(string userId);
        Task<CheckInStatusDto>CheckInAsync(string userId, AttendanceStatus status);

        Task<CheckInStatsDto> GetMyStatsAsync(string userId, int? monat, int? jahr);

    }
}
