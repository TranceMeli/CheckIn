using System.ComponentModel.DataAnnotations;

namespace backend.Dto
{
    public class SetPasswordDto
    {
        // set password

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Token { get; set; } = string.Empty;


        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; } = string.Empty;

        [Compare("NewPassword", ErrorMessage = "Passwörter stimmen nicht überein.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
