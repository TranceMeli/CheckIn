namespace backend.Dto
{
    public class CheckInStatsDto
    {
        public int Total { get; set; }
        public int HomeOfficeCount {get; set; }
        public int OfficeCount {get; set; }
        public int AbwesendCount {get; set; }
        public List<DailyEntryDto> Monthly { get; set; } = new();
    }

    public class DailyEntryDto
    {
        public string Date { get; set; } = string.Empty;
        public int HomeOffice { get; set; }
        public int Office { get; set; }
        public int Abwesend { get; set; }
    }
}
