using Pods.Application.Common.Models;
using Pods.Application.DTOs;

namespace Pods.Application.Interfaces;

public interface ICheckInService
{
    Task<ServiceResult<CheckInDto>> SubmitCheckInAsync(SubmitCheckInDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ServiceResult<bool>> ReviewCheckInAsync(Guid checkInId, Guid reviewerUserId, ReviewCheckInDto dto, CancellationToken cancellationToken = default);
    Task<ServiceResult<List<CheckInDto>>> GetPendingReviewsForGroupAsync(Guid groupId, Guid reviewerUserId, CancellationToken cancellationToken = default);
}
