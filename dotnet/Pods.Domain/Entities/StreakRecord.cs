using Pods.Domain.Common;

namespace Pods.Domain.Entities;

public class StreakRecord : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid CommitmentId { get; private set; }
    public int CurrentStreakDays { get; private set; }
    public int LongestStreakDays { get; private set; }
    public DateTime? LastCheckInDateUtc { get; private set; }
    public int TotalCompletedCheckIns { get; private set; }

    public UserProfile User { get; private set; } = null!;
    public Commitment Commitment { get; private set; } = null!;

    protected StreakRecord() { }

    public StreakRecord(Guid userId, Guid commitmentId)
    {
        UserId = userId;
        CommitmentId = commitmentId;
        CurrentStreakDays = 0;
        LongestStreakDays = 0;
        TotalCompletedCheckIns = 0;
    }

    public void RecordSuccessfulCheckIn(DateTime checkInDateUtc)
    {
        TotalCompletedCheckIns++;

        if (LastCheckInDateUtc.HasValue)
        {
            var difference = (checkInDateUtc.Date - LastCheckInDateUtc.Value.Date).TotalDays;
            if (difference == 1)
            {
                CurrentStreakDays++;
            }
            else if (difference > 1)
            {
                CurrentStreakDays = 1;
            }
            // If difference == 0, multiple check-ins on same day, streak count unchanged
        }
        else
        {
            CurrentStreakDays = 1;
        }

        if (CurrentStreakDays > LongestStreakDays)
        {
            LongestStreakDays = CurrentStreakDays;
        }

        LastCheckInDateUtc = checkInDateUtc;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void ResetStreakIfBroken(DateTime todayUtc)
    {
        if (LastCheckInDateUtc.HasValue && (todayUtc.Date - LastCheckInDateUtc.Value.Date).TotalDays > 1)
        {
            CurrentStreakDays = 0;
            UpdatedAtUtc = DateTime.UtcNow;
        }
    }
}
