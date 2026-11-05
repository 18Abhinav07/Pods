using Pods.Domain.Common;
using Pods.Domain.Enums;
using Pods.Domain.Exceptions;

namespace Pods.Domain.Entities;

public class Commitment : BaseEntity, IAggregateRoot
{
    public Guid GroupId { get; private set; }
    public Guid UserId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public CommitmentFrequency Frequency { get; private set; }
    public CommitmentStatus Status { get; private set; }
    public VerificationMethod VerificationMethod { get; private set; }
    public int TargetCountPerPeriod { get; private set; } = 1;
    public DateTime StartDateUtc { get; private set; }
    public DateTime? EndDateUtc { get; private set; }
    public decimal StakeAmount { get; private set; } = 0m;

    public AccountabilityGroup Group { get; private set; } = null!;
    public UserProfile User { get; private set; } = null!;

    private readonly List<CheckIn> _checkIns = new();
    public IReadOnlyCollection<CheckIn> CheckIns => _checkIns.AsReadOnly();

    protected Commitment() { }

    public Commitment(
        Guid groupId,
        Guid userId,
        string title,
        string description,
        CommitmentFrequency frequency,
        VerificationMethod verificationMethod,
        int targetCountPerPeriod,
        DateTime startDateUtc,
        DateTime? endDateUtc = null,
        decimal stakeAmount = 0m)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainRuleViolationException("Commitment title is required.");

        if (targetCountPerPeriod < 1)
            throw new DomainRuleViolationException("Target count per period must be at least 1.");

        if (endDateUtc.HasValue && endDateUtc.Value <= startDateUtc)
            throw new DomainRuleViolationException("End date must be after start date.");

        GroupId = groupId;
        UserId = userId;
        Title = title;
        Description = description;
        Frequency = frequency;
        VerificationMethod = verificationMethod;
        TargetCountPerPeriod = targetCountPerPeriod;
        StartDateUtc = startDateUtc;
        EndDateUtc = endDateUtc;
        StakeAmount = stakeAmount;
        Status = CommitmentStatus.Active;
    }

    public CheckIn RecordCheckIn(string notes, DateTime? timestamp = null)
    {
        if (Status != CommitmentStatus.Active)
            throw new DomainRuleViolationException("Cannot submit check-ins for an inactive commitment.");

        var checkInDate = timestamp ?? DateTime.UtcNow;
        var checkIn = new CheckIn(Id, UserId, checkInDate, notes, VerificationMethod);
        _checkIns.Add(checkIn);
        UpdatedAtUtc = DateTime.UtcNow;
        return checkIn;
    }

    public void Pause()
    {
        if (Status != CommitmentStatus.Active)
            throw new DomainRuleViolationException("Only active commitments can be paused.");
        Status = CommitmentStatus.Paused;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Resume()
    {
        if (Status != CommitmentStatus.Paused)
            throw new DomainRuleViolationException("Only paused commitments can be resumed.");
        Status = CommitmentStatus.Active;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Complete()
    {
        Status = CommitmentStatus.Completed;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
