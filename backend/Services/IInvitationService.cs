using backend.Dto;

namespace backend.Services
{

    public interface IInvitationService
    {
        Task SendInvitationAsync(InviteUserDto dto);
    }
}
