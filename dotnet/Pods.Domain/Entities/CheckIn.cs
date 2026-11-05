using Pods.Domain.Common;
using Pods.Domain.Enums;

namespace Pods.Domain.Entities;

public class CheckIn : BaseEntity
{
    public Guid CommitmentId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime CheckInTimestampUtc { get; private set; }
    public string Notes { get; private set; } = string.Empty;
    public CheckInStatus Status { get; private set; }
    public VerificationMethod VerificationMethod { get; private set; }
    public Guid? VerifiedByUserId { get; private set; }
    public DateTime? VerifiedAtUtc { get; private set; }
    public string? RejectionReason { get; private set; }

    public Commitment Commitment { get; private set; } = null!;
    public UserProfile User { get; private set; } = null!;

    private readonly List<CheckInProof> _proofs = new();
    public IReadOnlyCollection<CheckInProof> Proofs => _proofs.AsReadOnly();

    protected CheckIn() { }

    public CheckIn(Guid commitmentId, Guid userId, DateTime timestamp, string notes, VerificationMethod method)
    {
        CommitmentId = commitmentId;
        UserId = userId;
        CheckInTimestampUtc = timestamp;
        Notes = notes;
        VerificationMethod = method;
        Status = method == VerificationMethod.SelfReported ? CheckInStatus.Verified : CheckInStatus.PendingReview;
    }

    public void AddProof(string fileUrl, string fileType, long fileSizeBytes)
    {
        _proofs.Add(new CheckInProof(Id, fileUrl, fileType, fileSizeBytes));
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Verify(Guid verifierUserId)
    {
        Status = CheckInStatus.Verified;
        VerifiedByUserId = verifierUserId;
        VerifiedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Reject(Guid verifierUserId, string reason)
    {
        Status = CheckInStatus.Rejected;
        VerifiedByUserId = verifierUserId;
        VerifiedAtUtc = DateTime.UtcNow;
        RejectionReason = reason;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
