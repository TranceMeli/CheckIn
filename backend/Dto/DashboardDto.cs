namespace backend.Dto
{
    public class StatusCountsDto
    {
        public int Office { get; set; }
        public int HomeOffice { get; set; }
        public int Abwesend { get; set; }
        public int Total => Office + HomeOffice + Abwesend;
    }

    public class LabelCountsDto : StatusCountsDto
    {
        public string Label { get; set; } = string.Empty;
    }

    public class RankingEntryDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Abteilung { get; set; } = string.Empty;
        public int Office { get; set; }
    }

    public class DashboardOverviewDto
    {
        public StatusCountsDto Gesamt { get; set; } = new();
        public List<LabelCountsDto> Wochentage { get; set; } = new();
        public List<LabelCountsDto> Abteilungen { get; set; } = new();
        public List<RankingEntryDto> Ranking { get; set; } = new();
    }

    public class HeatmapWocheDto
    {
        public int Woche { get; set; }
        public int Total { get; set; }
        public int Office { get; set; }
    }

    public class TeamWocheEintragDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Abteilung { get; set; } = string.Empty;
        // Mo-Fr, null = kein Check-in
        public string?[] Tage { get; set; } = new string?[5];
    }
}
