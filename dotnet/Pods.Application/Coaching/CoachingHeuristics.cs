using Pods.Application.DTOs;
using Pods.Domain.Entities;
using Pods.Domain.Enums;

namespace Pods.Application.Coaching;

/// <summary>
/// A user's recent accountability record, reduced to the numbers coaching needs.
/// Built once and shared by the language model prompt and the deterministic fallback,
/// so both reason over the same facts.
/// </summary>
public record CoachingSnapshot(
    Guid UserId,
    int ActiveCommitments,
    int VerifiedCheckInsLast7Days,
    int RejectedCheckInsLast7Days,
    int PendingCheckInsLast7Days,
    int ExpectedCheckInsLast7Days,
    int BestCurrentStreak,
    int LongestStreakEver,
    int CommitmentsWithBrokenStreak,
    double LateCheckInShare);

public static class CoachingHeuristics
{
    private const int WindowDays = 7;
    private const int LateHourUtc = 21;

    public static CoachingSnapshot BuildSnapshot(
        Guid userId,
        IReadOnlyCollection<Commitment> commitments,
        IReadOnlyCollection<CheckIn> checkIns,
        IReadOnlyCollection<StreakRecord> streaks,
        DateTime nowUtc)
    {
        var windowStart = nowUtc.Date.AddDays(-(WindowDays - 1));
        var recent = checkIns.Where(c => c.CheckInTimestampUtc >= windowStart && c.CheckInTimestampUtc <= nowUtc).ToList();
        var active = commitments.Where(c => c.Status == CommitmentStatus.Active).ToList();

        var expected = active.Sum(c => c.Frequency switch
        {
            CommitmentFrequency.Daily => WindowDays * c.TargetCountPerPeriod,
            CommitmentFrequency.Weekdays => 5 * c.TargetCountPerPeriod,
            _ => c.TargetCountPerPeriod
        });

        var verified = recent.Count(c => c.Status == CheckInStatus.Verified);
        var late = recent.Count(c => c.CheckInTimestampUtc.Hour >= LateHourUtc);

        return new CoachingSnapshot(
            userId,
            active.Count,
            verified,
            recent.Count(c => c.Status == CheckInStatus.Rejected),
            recent.Count(c => c.Status == CheckInStatus.PendingReview),
            expected,
            streaks.Count == 0 ? 0 : streaks.Max(s => s.CurrentStreakDays),
            streaks.Count == 0 ? 0 : streaks.Max(s => s.LongestStreakDays),
            streaks.Count(s => s.CurrentStreakDays == 0 && s.TotalCompletedCheckIns > 0),
            recent.Count == 0 ? 0 : Math.Round((double)late / recent.Count, 2));
    }

    /// <summary>Completion rate for the window, clamped to [0, 1].</summary>
    public static double CompletionRate(CoachingSnapshot s) =>
        s.ExpectedCheckInsLast7Days == 0 ? 0 : Math.Min(1.0, (double)s.VerifiedCheckInsLast7Days / s.ExpectedCheckInsLast7Days);

    /// <summary>
    /// Deterministic coaching used when no model is configured or the model call fails.
    /// Every sentence it returns is derived from the snapshot.
    /// </summary>
    public static AiCoachingFeedbackDto Evaluate(CoachingSnapshot s)
    {
        if (s.ActiveCommitments == 0)
        {
            return new AiCoachingFeedbackDto(
                "No active commitments yet.",
                "Pick one small commitment in a group and check in tomorrow.",
                new List<string> { "Create a daily commitment with a target of 1" },
                new List<string>(),
                0);
        }

        var rate = CompletionRate(s);
        var adjustments = new List<string>();
        var risks = new List<string>();

        if (rate < 0.5)
            adjustments.Add("Lower the target count until you can hit it five days running");
        if (s.LateCheckInShare >= 0.5)
        {
            risks.Add($"{s.LateCheckInShare:P0} of check-ins land after {LateHourUtc}:00 UTC");
            adjustments.Add("Move the check-in earlier in the day");
        }
        if (s.RejectedCheckInsLast7Days > 0)
        {
            risks.Add($"{s.RejectedCheckInsLast7Days} check-in(s) rejected by peers this week");
            adjustments.Add("Attach clearer evidence so reviewers can verify on the first pass");
        }
        if (s.PendingCheckInsLast7Days > 0)
            risks.Add($"{s.PendingCheckInsLast7Days} check-in(s) still waiting on peer review");
        if (s.CommitmentsWithBrokenStreak > 0)
            risks.Add($"{s.CommitmentsWithBrokenStreak} commitment(s) lost their streak");

        // Score: completion dominates, streak momentum adds up to 20 points, rejections subtract.
        var momentum = Math.Min(20, s.BestCurrentStreak * 2);
        var score = Math.Clamp(rate * 80 + momentum - s.RejectedCheckInsLast7Days * 5, 0, 100);

        var summary = $"{s.VerifiedCheckInsLast7Days} of {s.ExpectedCheckInsLast7Days} expected check-ins verified in the last 7 days ({rate:P0}).";
        var message = s.BestCurrentStreak > 0
            ? $"Your best active streak is {s.BestCurrentStreak} day(s); your record is {s.LongestStreakEver}."
            : "No active streak right now. One verified check-in starts a new one.";

        return new AiCoachingFeedbackDto(summary, message, adjustments, risks, Math.Round(score, 1));
    }

    /// <summary>
    /// Splits a goal into weekly checkpoints plus a final verification day.
    /// </summary>
    public static AiGoalBreakdownDto BreakDownGoal(string goal, int targetDays)
    {
        if (string.IsNullOrWhiteSpace(goal))
            throw new ArgumentException("Goal description is required.", nameof(goal));
        if (targetDays < 1)
            throw new ArgumentOutOfRangeException(nameof(targetDays), "Target days must be at least 1.");

        var milestones = new List<MilestoneItemDto> { new(1, "Set up and complete the first session", "Check in with a short note on what you did") };
        for (var day = 7; day < targetDays; day += 7)
            milestones.Add(new(day, $"Week {day / 7} review: hit the weekly target", "All check-ins for the week verified"));
        if (targetDays > 1)
            milestones.Add(new(targetDays, "Final verification and group retrospective", "Upload evidence of the finished goal for peer review"));

        var weeks = (int)Math.Ceiling(targetDays / 7.0);
        return new AiGoalBreakdownDto(goal.Trim(), $"{targetDays} days split into {weeks} weekly checkpoint(s), each verified by the group.", milestones);
    }
}
