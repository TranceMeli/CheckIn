namespace backend.Dto
{
    public class AbteilungStatsDto
    {
        public string Abteilung { get; set; } = string.Empty;
        public int HomeOffice { get; set; }
        public int Office { get; set; }
        public int Abwesend { get; set; }
    }
}