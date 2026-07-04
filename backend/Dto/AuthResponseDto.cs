namespace backend.Dto
{
    // Access Token kommt im Body zurück (kurzlebig, 15 min)
    // Refresh Token kommt als HttpOnly Cookie – nie im Body
    public class AuthResponseDto
    {
        public string AccessToken { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public List<string> Roles { get; set; } = new();

        // Nur intern – Controller liest das aus und setzt Cookie
        // JsonIgnore damit es nie im Response-Body landet
        [System.Text.Json.Serialization.JsonIgnore]
        public string RefreshToken { get; set; } = string.Empty;
    }
}