using System.ComponentModel.DataAnnotations;

namespace backend.Dto
{
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public required string Password { get; set; } = string.Empty;
    }
}
