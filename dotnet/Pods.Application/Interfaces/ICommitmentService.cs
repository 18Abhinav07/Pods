using Pods.Application.Common.Models;
using Pods.Application.DTOs;

namespace Pods.Application.Interfaces;

public interface ICommitmentService
{
    Task<ServiceResult<CommitmentDto>> CreateCommitmentAsync(CreateCommitmentDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ServiceResult<List<CommitmentDto>>> GetUserCommitmentsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ServiceResult<List<CommitmentDto>>> GetGroupCommitmentsAsync(Guid groupId, CancellationToken cancellationToken = default);
    Task<ServiceResult<bool>> UpdateStatusAsync(Guid commitmentId, Guid userId, UpdateCommitmentStatusDto dto, CancellationToken cancellationToken = default);
}
