namespace backend.Services
{
    public interface IEmailService
    {

        Task SendInvitationAsync(string email, string link);
    }
}
