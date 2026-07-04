using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dto
{
    public class CheckInDto
    {
        [Required]
        public AttendanceStatus Status { get; set; }
    }
}
