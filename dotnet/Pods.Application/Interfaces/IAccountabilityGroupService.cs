using Pods.Application.Common.Models;
using Pods.Application.DTOs;

namespace Pods.Application.Interfaces;

public interface IAccountabilityGroupService
{
    Task<ServiceResult<GroupDetailDto>> CreateGroupAsync(CreateGroupDto dto, Guid creatorUserId, CancellationToken cancellationToken = default);
    Task<ServiceResult<List<GroupSummaryDto>>> GetPublicGroupsAsync(CancellationToken cancellationToken = default);
    Task<ServiceResult<GroupDetailDto>> GetGroupByIdAsync(Guid groupId, CancellationToken cancellationToken = default);
    Task<ServiceResult<bool>> JoinGroupAsync(Guid groupId, Guid userId, string? inviteCode = null, CancellationToken cancellationToken = default);
    Task<ServiceResult<bool>> LeaveGroupAsync(Guid groupId, Guid userId, CancellationToken cancellationToken = default);
}
