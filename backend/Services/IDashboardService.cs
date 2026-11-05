using backend.Dto;

namespace backend.Services
{
    public interface IDashboardService
    {
        Task<DashboardOverviewDto> GetOverviewAsync(DateTime von, DateTime bis, string? abteilung, string? userId);
        Task<List<LabelCountsDto>> GetVerlaufAsync(int jahr, string? abteilung, string? userId);
        Task<List<HeatmapWocheDto>> GetHeatmapAsync(int jahr, string? abteilung, string? userId);
        Task<List<TeamWocheEintragDto>> GetTeamWocheAsync(DateTime montag, string? abteilung);
    }
}
