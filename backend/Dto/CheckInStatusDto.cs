using backend.Models;

namespace backend.Dto
{
    public class CheckInStatusDto
    {
        public string UserId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public AttendanceStatus Status { get; set; }
        public DateTime Timestamp { get; set; }
        public bool AlreadyCheckedIn { get; set; }
    }
}
