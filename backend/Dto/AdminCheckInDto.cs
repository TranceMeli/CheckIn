using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dto
{
    public class AdminCheckInDto
    {
        [Required]
        public AttendanceStatus Status { get; set; }

        // Tag des nachgetragenen Check-ins; ohne Angabe: heute
        public DateTime? Datum { get; set; }
    }

    public class CheckInEintragDto
    {
        public string Datum { get; set; } = string.Empty; // yyyy-MM-dd
        public AttendanceStatus Status { get; set; }
    }

    public class AdminCheckInResultDto
    {
        public bool Gespeichert { get; set; }
        // Gesetzt, wenn für den Tag bereits ein Eintrag existiert
        public AttendanceStatus? BestehenderStatus { get; set; }
        public string Datum { get; set; } = string.Empty;
    }
}
