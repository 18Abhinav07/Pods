using FluentAssertions;
using Pods.Application.Coaching;
using Pods.Domain.Entities;
using Pods.Domain.Enums;
using Xunit;

namespace Pods.Tests.Unit;

public class CoachingHeuristicsTests
{
    private static readonly DateTime Now = new(2026, 3, 8, 12, 0, 0, DateTimeKind.Utc);
    private static readonly Guid User = Guid.NewGuid();

    private static Commitment Daily(VerificationMethod method = VerificationMethod.SelfReported) =>
        new(Guid.NewGuid(), User, "Meditate", "", CommitmentFrequency.Daily, method, 1, Now.AddDays(-30));

    [Fact]
    public void BuildSnapshot_CountsOnlyTheLastSevenDays()
    {
        var commitment = Daily();
        var checkIns = new List<CheckIn>
        {
            commitment.RecordCheckIn("old", Now.AddDays(-10)),
            commitment.RecordCheckIn("a", Now.AddDays(-2)),
            commitment.RecordCheckIn("b", Now.AddDays(-1))
        };

        var s = CoachingHeuristics.BuildSnapshot(User, new[] { commitment }, checkIns, Array.Empty<StreakRecord>(), Now);

        s.VerifiedCheckInsLast7Days.Should().Be(2);
        s.ExpectedCheckInsLast7Days.Should().Be(7);
        s.ActiveCommitments.Should().Be(1);
    }

    [Fact]
    public void BuildSnapshot_ExpectedCountFollowsFrequency()
    {
        var weekdays = new Commitment(Guid.NewGuid(), User, "Code", "", CommitmentFrequency.Weekdays, VerificationMethod.SelfReported, 2, Now.AddDays(-30));
        var weekly = new Commitment(Guid.NewGuid(), User, "Long run", "", CommitmentFrequency.Weekly, VerificationMethod.SelfReported, 1, Now.AddDays(-30));
        var paused = Daily();
        paused.Pause();

        var s = CoachingHeuristics.BuildSnapshot(User, new[] { weekdays, weekly, paused }, Array.Empty<CheckIn>(), Array.Empty<StreakRecord>(), Now);

        s.ExpectedCheckInsLast7Days.Should().Be(5 * 2 + 1);
        s.ActiveCommitments.Should().Be(2);
    }

    [Fact]
    public void BuildSnapshot_SeparatesPendingAndRejectedCheckIns()
    {
        var commitment = Daily(VerificationMethod.PeerReview);
        var pending = commitment.RecordCheckIn("p", Now.AddDays(-1));
        var rejected = commitment.RecordCheckIn("r", Now.AddDays(-2));
        rejected.Reject(Guid.NewGuid(), "no evidence");

        var s = CoachingHeuristics.BuildSnapshot(User, new[] { commitment }, new[] { pending, rejected }, Array.Empty<StreakRecord>(), Now);

        s.PendingCheckInsLast7Days.Should().Be(1);
        s.RejectedCheckInsLast7Days.Should().Be(1);
        s.VerifiedCheckInsLast7Days.Should().Be(0);
    }

    [Fact]
    public void Evaluate_WithNoActiveCommitments_SuggestsStartingOne()
    {
        var s = new CoachingSnapshot(User, 0, 0, 0, 0, 0, 0, 0, 0, 0);

        var result = CoachingHeuristics.Evaluate(s);

        result.PredictedSuccessScore.Should().Be(0);
        result.RecommendedAdjustments.Should().ContainSingle();
    }

    [Fact]
    public void Evaluate_PerfectWeek_ScoresHighWithNoRisks()
    {
        var s = new CoachingSnapshot(User, 1, 7, 0, 0, 7, 12, 12, 0, 0);

        var result = CoachingHeuristics.Evaluate(s);

        result.PredictedSuccessScore.Should().Be(100);
        result.RiskFactors.Should().BeEmpty();
        result.Summary.Should().Contain("7 of 7");
    }

    [Fact]
    public void Evaluate_LowCompletionLateAndRejected_FlagsEachRisk()
    {
        var s = new CoachingSnapshot(User, 2, 3, 2, 1, 14, 0, 5, 1, 0.75);

        var result = CoachingHeuristics.Evaluate(s);

        result.RecommendedAdjustments.Should().HaveCount(3);
        result.RiskFactors.Should().HaveCount(4);
        result.PredictedSuccessScore.Should().BeInRange(0, 30);
    }

    [Theory]
    [InlineData(1, 1)]
    [InlineData(7, 2)]
    [InlineData(30, 6)]
    public void BreakDownGoal_PlacesWeeklyCheckpointsInsideTheWindow(int days, int expectedMilestones)
    {
        var plan = CoachingHeuristics.BreakDownGoal("Ship a side project", days);

        plan.RecommendedMilestones.Should().HaveCount(expectedMilestones);
        plan.RecommendedMilestones.Should().OnlyContain(m => m.DayNumber >= 1 && m.DayNumber <= days);
        plan.RecommendedMilestones.Last().DayNumber.Should().Be(days);
    }

    [Fact]
    public void BreakDownGoal_RejectsInvalidInput()
    {
        FluentActions.Invoking(() => CoachingHeuristics.BreakDownGoal("", 10)).Should().Throw<ArgumentException>();
        FluentActions.Invoking(() => CoachingHeuristics.BreakDownGoal("Run", 0)).Should().Throw<ArgumentOutOfRangeException>();
    }
}
