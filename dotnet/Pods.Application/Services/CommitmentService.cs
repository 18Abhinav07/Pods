using Microsoft.EntityFrameworkCore;
using Pods.Application.Common.Interfaces;
using Pods.Application.Common.Models;
using Pods.Application.DTOs;
using Pods.Application.Interfaces;
using Pods.Domain.Entities;
using Pods.Domain.Enums;

namespace Pods.Application.Services;

public class CommitmentService : ICommitmentService
{
    private readonly IApplicationDbContext _context;

    public CommitmentService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<CommitmentDto>> CreateCommitmentAsync(CreateCommitmentDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var isMember = await _context.GroupMemberships
            .AnyAsync(m => m.GroupId == dto.GroupId && m.UserId == userId && m.IsActive, cancellationToken);

        if (!isMember)
            return ServiceResult<CommitmentDto>.Failure("User must be an active member of the group to create commitments.");

        var commitment = new Commitment(
            dto.GroupId,
            userId,
            dto.Title,
            dto.Description,
            dto.Frequency,
            dto.VerificationMethod,
            dto.TargetCountPerPeriod,
            dto.StartDateUtc,
            dto.EndDateUtc,
            dto.StakeAmount
        );

        _context.Commitments.Add(commitment);

        var streak = new StreakRecord(userId, commitment.Id);
        _context.StreakRecords.Add(streak);

        await _context.SaveChangesAsync(cancellationToken);

        var group = await _context.AccountabilityGroups.FindAsync(new object[] { dto.GroupId }, cancellationToken);
        var user = await _context.UserProfiles.FindAsync(new object[] { userId }, cancellationToken);

        var resultDto = new CommitmentDto(
            commitment.Id,
            commitment.GroupId,
            group?.Name ?? "Group",
            commitment.UserId,
            user?.DisplayName ?? "User",
            commitment.Title,
            commitment.Description,
            commitment.Frequency,
            commitment.Status,
            commitment.VerificationMethod,
            commitment.TargetCountPerPeriod,
            commitment.StartDateUtc,
            commitment.EndDateUtc,
            commitment.StakeAmount,
            0,
            0
        );

        return ServiceResult<CommitmentDto>.Success(resultDto);
    }

    public async Task<ServiceResult<List<CommitmentDto>>> GetUserCommitmentsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var commitments = await _context.Commitments
            .Include(c => c.Group)
            .Include(c => c.User)
            .Where(c => c.UserId == userId && !c.IsDeleted)
            .ToListAsync(cancellationToken);

        var streakDict = await _context.StreakRecords
            .Where(s => s.UserId == userId)
            .ToDictionaryAsync(s => s.CommitmentId, cancellationToken);

        var dtos = commitments.Select(c =>
        {
            streakDict.TryGetValue(c.Id, out var streak);
            return new CommitmentDto(
                c.Id,
                c.GroupId,
                c.Group?.Name ?? "Group",
                c.UserId,
                c.User?.DisplayName ?? "User",
                c.Title,
                c.Description,
                c.Frequency,
                c.Status,
                c.VerificationMethod,
                c.TargetCountPerPeriod,
                c.StartDateUtc,
                c.EndDateUtc,
                c.StakeAmount,
                streak?.CurrentStreakDays ?? 0,
                streak?.LongestStreakDays ?? 0
            );
        }).ToList();

        return ServiceResult<List<CommitmentDto>>.Success(dtos);
    }

    public async Task<ServiceResult<List<CommitmentDto>>> GetGroupCommitmentsAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        var commitments = await _context.Commitments
            .Include(c => c.Group)
            .Include(c => c.User)
            .Where(c => c.GroupId == groupId && !c.IsDeleted)
            .ToListAsync(cancellationToken);

        var commitmentIds = commitments.Select(c => c.Id).ToList();
        var streakDict = await _context.StreakRecords
            .Where(s => commitmentIds.Contains(s.CommitmentId))
            .ToDictionaryAsync(s => s.CommitmentId, cancellationToken);

        var dtos = commitments.Select(c =>
        {
            streakDict.TryGetValue(c.Id, out var streak);
            return new CommitmentDto(
                c.Id,
                c.GroupId,
                c.Group?.Name ?? "Group",
                c.UserId,
                c.User?.DisplayName ?? "User",
                c.Title,
                c.Description,
                c.Frequency,
                c.Status,
                c.VerificationMethod,
                c.TargetCountPerPeriod,
                c.StartDateUtc,
                c.EndDateUtc,
                c.StakeAmount,
                streak?.CurrentStreakDays ?? 0,
                streak?.LongestStreakDays ?? 0
            );
        }).ToList();

        return ServiceResult<List<CommitmentDto>>.Success(dtos);
    }

    public async Task<ServiceResult<bool>> UpdateStatusAsync(Guid commitmentId, Guid userId, UpdateCommitmentStatusDto dto, CancellationToken cancellationToken = default)
    {
        var commitment = await _context.Commitments.FirstOrDefaultAsync(c => c.Id == commitmentId && c.UserId == userId, cancellationToken);
        if (commitment == null)
            return ServiceResult<bool>.Failure("Commitment not found or unauthorized.");

        switch (dto.Status)
        {
            case CommitmentStatus.Paused:
                commitment.Pause();
                break;
            case CommitmentStatus.Active:
                commitment.Resume();
                break;
            case CommitmentStatus.Completed:
                commitment.Complete();
                break;
            default:
                return ServiceResult<bool>.Failure("Invalid status transition.");
        }

        await _context.SaveChangesAsync(cancellationToken);
        return ServiceResult<bool>.Success(true);
    }
}
