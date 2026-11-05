using Pods.Domain.Enums;

namespace Pods.Application.DTOs;

public record CreateCommitmentDto(Guid GroupId, string Title, string Description, CommitmentFrequency Frequency, VerificationMethod VerificationMethod, int TargetCountPerPeriod, DateTime StartDateUtc, DateTime? EndDateUtc, decimal StakeAmount);
public record CommitmentDto(Guid Id, Guid GroupId, string GroupName, Guid UserId, string UserName, string Title, string Description, CommitmentFrequency Frequency, CommitmentStatus Status, VerificationMethod VerificationMethod, int TargetCountPerPeriod, DateTime StartDateUtc, DateTime? EndDateUtc, decimal StakeAmount, int CurrentStreak, int LongestStreak);
public record UpdateCommitmentStatusDto(CommitmentStatus Status);
