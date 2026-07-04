namespace backend.Dto
{
    public class CheckInListDto
    {
        public string FirstName { get; set; } =  string.Empty;
        public string LastName { get; set; } = string.Empty;
        public List<CheckInStatusDto> CheckIns { get; set; } = new();
    }
}
