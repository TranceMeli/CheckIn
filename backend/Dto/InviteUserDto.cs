using System.ComponentModel.DataAnnotations;

namespace backend.Dto
{
    public class InviteUserDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Abteilung { get; set; } = string.Empty;
    }
}