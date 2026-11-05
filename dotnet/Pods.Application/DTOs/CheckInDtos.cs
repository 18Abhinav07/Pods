using Pods.Domain.Enums;

namespace Pods.Application.DTOs;

public record SubmitCheckInDto(Guid CommitmentId, string Notes, string? EvidenceFileBase64, string? EvidenceFileName, string? EvidenceContentType);
public record CheckInDto(Guid Id, Guid CommitmentId, string CommitmentTitle, Guid UserId, string UserName, DateTime TimestampUtc, string Notes, CheckInStatus Status, VerificationMethod VerificationMethod, List<string> ProofUrls, string? RejectionReason);
public record ReviewCheckInDto(bool Approved, string? RejectionReason);
