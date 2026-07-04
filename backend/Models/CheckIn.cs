using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models
{
 
    public class CheckIn
    {

        [Key]
        public int Id { get; set; }
        [Required]
        public AttendanceStatus Status { get; set; }
        public DateTime Timestamp { get; set; } 
        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey("UserId")]
        public User User { get; set; }
    }
}
